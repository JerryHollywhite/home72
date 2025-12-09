import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendMessage, sendDocument, getKeyboard } from '@/lib/telegram/bot'
import { format } from 'date-fns'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const update = await request.json()

        const message = update.message
        if (!message) return NextResponse.json({ ok: true })

        const chatId = message.chat.id
        const text = message.text || ''
        const photo = message.photo?.[message.photo.length - 1] // Highest resolution

        // Get or create session
        let { data: session } = await supabase
            .from('telegram_sessions')
            .select('*')
            .eq('chat_id', chatId)
            .single()

        if (!session) {
            // New user
            await supabase.from('telegram_sessions').insert({
                chat_id: chatId,
                state: 'awaiting_room',
            })
            session = { chat_id: chatId, state: 'awaiting_room', tenant_id: null, room_number: null, temp_data: {} }
        }

        // Handle commands
        if (text.startsWith('/')) {
            await handleCommand(chatId, text, session)
        } else if (session.state === 'awaiting_room') {
            await handleRoomRegistration(chatId, text, session)
        } else if (session.state === 'awaiting_payment_photo') {
            await handlePaymentPhoto(chatId, photo, session)
        } else if (session.state === 'awaiting_complaint') {
            await handleComplaint(chatId, text, photo, session)
        } else {
            await sendMessage(chatId, 'Gunakan /help untuk lihat perintah yang tersedia')
        }

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('Telegram webhook error:', error)
        return NextResponse.json({ ok: true }) // Always return 200 to Telegram
    }
}

async function handleCommand(chatId: number, command: string, session: any) {
    const cmd = command.split(' ')[0].toLowerCase()

    switch (cmd) {
        case '/start':
            await sendMessage(
                chatId,
                `🏠 *Selamat datang di Home72 Bot!*\n\nUntuk mulai, silakan masukkan nomor kamar Anda (contoh: 103)\n\nGunakan /help untuk bantuan.`,
                { parse_mode: 'Markdown' }
            )
            await supabase
                .from('telegram_sessions')
                .update({ state: 'awaiting_room' })
                .eq('chat_id', chatId)
            break

        case '/help':
            await sendMessage(
                chatId,
                `*Perintah Bot Home72:*\n\n` +
                `/start - Daftar dengan nomor kamar\n` +
                `/bayar - Upload bukti bayar\n` +
                `/komplain - Kirim pengaduan\n` +
                `/status - Cek status pembayaran\n` +
                `/invoice - Download invoice terakhir\n` +
                `/help - Bantuan`,
                { parse_mode: 'Markdown' }
            )
            break

        case '/bayar':
            if (!session.tenant_id) {
                await sendMessage(chatId, 'Anda belum terdaftar. Gunakan /start terlebih dahulu.')
                return
            }
            await sendMessage(
                chatId,
                `📸 *Upload Bukti Bayar*\n\nSilakan kirim foto bukti transfer Anda.\n\nPastikan foto jelas dan terbaca.`,
                { parse_mode: 'Markdown' }
            )
            await supabase
                .from('telegram_sessions')
                .update({ state: 'awaiting_payment_photo' })
                .eq('chat_id', chatId)
            break

        case '/komplain':
            if (!session.tenant_id) {
                await sendMessage(chatId, 'Anda belum terdaftar. Gunakan /start terlebih dahulu.')
                return
            }
            await sendMessage(
                chatId,
                `📝 *Kirim Pengaduan*\n\nJelaskan masalah yang Anda alami, atau kirim foto.`,
                { parse_mode: 'Markdown' }
            )
            await supabase
                .from('telegram_sessions')
                .update({ state: 'awaiting_complaint' })
                .eq('chat_id', chatId)
            break

        case '/status':
            await handleStatusCheck(chatId, session)
            break

        case '/invoice':
            await handleInvoiceRequest(chatId, session)
            break

        default:
            await sendMessage(chatId, 'Perintah tidak dikenali. Gunakan /help untuk bantuan.')
    }
}

async function handleRoomRegistration(chatId: number, roomNumber: string, session: any) {
    // Find tenant with this room number
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
      id,
      name,
      rooms (room_number, price)
    `)
        .eq('status', 'active')
        .eq('rooms.room_number', roomNumber)
        .single()

    if (error || !tenant) {
        await sendMessage(chatId, `❌ Kamar "${roomNumber}" tidak ditemukan atau tidak aktif.\n\nCoba cek lagi nomor kamar Anda.`)
        return
    }

    // Update session and tenant
    await supabase
        .from('telegram_sessions')
        .update({
            tenant_id: tenant.id,
            room_number: roomNumber,
            state: 'idle',
        })
        .eq('chat_id', chatId)

    await supabase
        .from('tenants')
        .update({ telegram_chat_id: chatId })
        .eq('id', tenant.id)

    await sendMessage(
        chatId,
        `✅ *Terdaftar!*\n\n` +
        `Nama: ${tenant.name}\n` +
        `Kamar: ${(tenant.rooms as any).room_number}\n` +
        `Sewa: Rp ${(tenant.rooms as any).price.toLocaleString('id-ID')}/bulan\n\n` +
        `Gunakan /help untuk lihat perintah.`,
        { parse_mode: 'Markdown' }
    )
}

async function handlePaymentPhoto(chatId: number, photo: any, session: any) {
    if (!photo) {
        await sendMessage(chatId, 'Silakan kirim foto bukti transfer.')
        return
    }

    try {
        // Get tenant data
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*, rooms(price)')
            .eq('id', session.tenant_id)
            .single()

        if (!tenant) throw new Error('Tenant not found')

        // Download photo from Telegram
        // In production, you'd download and upload to Supabase Storage
        // For now, we'll use the file_id as reference
        const file_id = photo.file_id
        const currentMonth = format(new Date(), 'yyyy-MM')

        // Create payment record
        await supabase.from('payments').insert({
            tenant_id: session.tenant_id,
            month: currentMonth,
            amount: (tenant.rooms as any).price,
            status: 'pending',
            payment_method: 'transfer',
            proof_url: `telegram_file:${file_id}`, // Placeholder
        })

        await sendMessage(
            chatId,
            `✅ *Bukti bayar diterima!*\n\n` +
            `Bulan: ${format(new Date(), 'MMMM yyyy')}\n` +
            `Jumlah: Rp ${(tenant.rooms as any).price.toLocaleString('id-ID')}\n\n` +
            `Menunggu verifikasi admin. Anda akan mendapat notifikasi jika sudah diverifikasi.`,
            { parse_mode: 'Markdown' }
        )

        await supabase
            .from('telegram_sessions')
            .update({ state: 'idle' })
            .eq('chat_id', chatId)
    } catch (error) {
        await sendMessage(chatId, '❌ Gagal memproses bukti bayar. Coba lagi.')
        console.error(error)
    }
}

async function handleComplaint(chatId: number, text: string, photo: any, session: any) {
    try {
        let photo_url = null
        if (photo) {
            photo_url = `telegram_file:${photo.file_id}` // Placeholder
        }

        const message = text || 'Lihat foto'

        await supabase.from('reports').insert({
            tenant_id: session.tenant_id,
            message,
            photo_url,
            status: 'open',
        })

        await sendMessage(
            chatId,
            `✅ *Pengaduan Diterima!*\n\nPengaduan Anda telah dikirim ke admin.\n\nAnda akan mendapat update status melalui bot ini.`,
            { parse_mode: 'Markdown' }
        )

        await supabase
            .from('telegram_sessions')
            .update({ state: 'idle' })
            .eq('chat_id', chatId)
    } catch (error) {
        await sendMessage(chatId, '❌ Gagal mengirim pengaduan. Coba lagi.')
        console.error(error)
    }
}

async function handleStatusCheck(chatId: number, session: any) {
    if (!session.tenant_id) {
        await sendMessage(chatId, 'Anda belum terdaftar. Gunakan /start terlebih dahulu.')
        return
    }

    try {
        const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('tenant_id', session.tenant_id)
            .order('created_at', { ascending: false })
            .limit(3)

        if (!payments || payments.length === 0) {
            await sendMessage(chatId, '📊 Belum ada riwayat pembayaran.')
            return
        }

        let statusText = '📊 *Status Pembayaran*\n\n'
        payments.forEach((p) => {
            const statusIcon = p.status === 'verified' ? '✅' : p.status === 'pending' ? '⏳' : '❌'
            const statusLabel = p.status === 'verified' ? 'Terverifikasi' : p.status === 'pending' ? 'Pending' : 'Ditolak'

            statusText += `*${p.month}*\n`
            statusText += `${statusIcon} ${statusLabel}\n`
            statusText += `Rp ${p.amount.toLocaleString('id-ID')}\n\n`
        })

        await sendMessage(chatId, statusText, { parse_mode: 'Markdown' })
    } catch (error) {
        await sendMessage(chatId, '❌ Gagal mengecek status.')
        console.error(error)
    }
}

async function handleInvoiceRequest(chatId: number, session: any) {
    if (!session.tenant_id) {
        await sendMessage(chatId, 'Anda belum terdaftar. Gunakan /start terlebih dahulu.')
        return
    }

    try {
        const { data: payment } = await supabase
            .from('payments')
            .select('*')
            .eq('tenant_id', session.tenant_id)
            .eq('status', 'verified')
            .order('verified_at', { ascending: false })
            .limit(1)
            .single()

        if (!payment) {
            await sendMessage(chatId, '❌ Tidak ada pembayaran terverifikasi untuk invoice.')
            return
        }

        await sendMessage(chatId, '📄 Generating invoice...')

        // Generate PDF invoice via API
        const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tenant/invoice/${payment.id}`

        await sendMessage(
            chatId,
            `📄 *Invoice ${payment.month}*\n\n` +
            `Download: ${invoiceUrl}\n\n` +
            `Atau akses melalui portal web.`,
            { parse_mode: 'Markdown' }
        )
    } catch (error) {
        await sendMessage(chatId, '❌ Gagal generate invoice.')
        console.error(error)
    }
}
