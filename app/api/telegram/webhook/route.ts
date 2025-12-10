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

async function uploadTelegramFile(fileId: string, bucketName: string) {
    try {
        // 1. Get file path from Telegram
        const token = process.env.TELEGRAM_BOT_TOKEN
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
        const fileData = await fileRes.json()

        if (!fileData.ok) throw new Error('Failed to get file path from Telegram')

        const filePath = fileData.result.file_path
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`

        // 2. Download file
        const imageRes = await fetch(fileUrl)
        const imageBuffer = await imageRes.arrayBuffer()

        // 3. Upload to Supabase
        // Generate filename: timestamp_random.jpg
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            })

        if (error) {
            console.error('Supabase storage upload error:', error)
            throw error
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)

        return publicUrl
    } catch (error) {
        console.error('Upload helper error:', error)
        return null
    }
}

async function handlePaymentPhoto(chatId: number, photo: any, session: any) {
    if (!photo) {
        await sendMessage(chatId, 'Silakan kirim foto bukti transfer.')
        return
    }

    await sendMessage(chatId, '⏳ Sedang mengupload bukti bayar...')

    try {
        // Get tenant data
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*, rooms(price)')
            .eq('id', session.tenant_id)
            .single()

        if (!tenant) throw new Error('Tenant not found')

        // UPLOAD TO SUPABASE STORAGE
        const file_id = photo.file_id
        const publicUrl = await uploadTelegramFile(file_id, 'payment-proofs')

        if (!publicUrl) {
            throw new Error('Gagal upload ke storage')
        }

        const currentMonth = format(new Date(), 'yyyy-MM')

        // Create payment record
        await supabase.from('payments').insert({
            tenant_id: session.tenant_id,
            month: currentMonth,
            amount: (tenant.rooms as any).price,
            status: 'pending',
            payment_method: 'transfer',
            proof_url: publicUrl, // Now saving real URL!
        })

        await sendMessage(
            chatId,
            `✅ *Bukti bayar diterima!*\n\n` +
            `Bulan: ${format(new Date(), 'MMMM yyyy')}\n` +
            `Jumlah: Rp ${(tenant.rooms as any).price.toLocaleString('id-ID')}\n\n` +
            `Menunggu verifikasi admin.`,
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
            await sendMessage(chatId, '⏳ Mengupload foto laporan...')
            const file_id = photo.file_id
            photo_url = await uploadTelegramFile(file_id, 'report-photos')

            if (!photo_url) {
                await sendMessage(chatId, '⚠️ Gagal upload foto, laporan akan dikirim tanpa foto.')
            }
        }

        const message = text || (photo ? 'Lampiran Foto' : 'Tanpa Keterangan')

        await supabase.from('reports').insert({
            tenant_id: session.tenant_id,
            message,
            photo_url, // Real URL or null
            status: 'open',
        })

        await sendMessage(
            chatId,
            `✅ *Pengaduan Diterima!*\n\nPengaduan Anda telah dikirim ke admin.`,
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

// ... existing imports ...

// ... existing code ...

async function handleInvoiceRequest(chatId: number, session: any) {
    if (!session.tenant_id) {
        await sendMessage(chatId, 'Anda belum terdaftar. Gunakan /start terlebih dahulu.')
        return
    }

    try {
        // 1. Get payment and tenant data
        const { data: payment } = await supabase
            .from('payments')
            .select(`
                *,
                tenants (
                    name,
                    phone,
                    email,
                    rooms (
                        room_number
                    )
                )
            `)
            .eq('tenant_id', session.tenant_id)
            .eq('status', 'verified')
            .order('verified_at', { ascending: false })
            .limit(1)
            .single()

        if (!payment) {
            await sendMessage(chatId, '❌ Tidak ada pembayaran terverifikasi untuk invoice.')
            return
        }

        await sendMessage(chatId, '📄 Sedang membuat invoice PDF...')

        // 2. Generate PDF (Lazy load to prevent cold start crashes)
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()

        // Header
        doc.setFillColor(37, 99, 235) // Blue
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.text('HOME72', 20, 20)
        doc.setFontSize(12)
        doc.text('Invoice Pembayaran Sewa Kamar', 20, 30)

        // Invoice Info
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.text(`Invoice ID: ${payment.id.substring(0, 8)}...`, 20, 55)
        doc.text(`Tanggal: ${new Date(payment.created_at).toLocaleDateString('id-ID')}`, 20, 62)

        // Tenant Info
        const tenant = payment.tenants as any
        doc.setFontSize(12)
        doc.text('Informasi Penyewa:', 20, 75)
        doc.setFontSize(10)
        doc.text(`Nama: ${tenant?.name || 'N/A'}`, 20, 82)
        doc.text(`Kamar: ${tenant?.rooms?.room_number || 'N/A'}`, 20, 89)

        // Payment Details
        doc.setFontSize(12)
        doc.text('Detail Pembayaran:', 20, 115)
        doc.setFontSize(10)
        doc.text(`Periode: ${payment.month}`, 20, 122)
        doc.text(`Jumlah: Rp ${payment.amount.toLocaleString('id-ID')}`, 20, 129)
        doc.text('Status: LUNAS', 20, 136)

        if (payment.verified_at) {
            doc.text(`Diverifikasi: ${new Date(payment.verified_at).toLocaleDateString('id-ID')}`, 20, 143)
        }

        // LUNAS Stamp
        doc.setDrawColor(37, 99, 235)
        doc.setLineWidth(1)
        doc.rect(140, 110, 50, 20)
        doc.setTextColor(37, 99, 235)
        doc.setFontSize(10)
        doc.text('LUNAS', 150, 122)

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text('Home72 Kosan - Sistem Manajemen Kosan Modern', 20, 280)

        // 3. Convert to Buffer
        const pdfArrayBuffer = doc.output('arraybuffer')
        const pdfBuffer = Buffer.from(pdfArrayBuffer)

        // 4. Send directly to Telegram
        await sendDocument(chatId, pdfBuffer, {}, {
            filename: `Invoice_${payment.month}.pdf`,
            contentType: 'application/pdf'
        })

    } catch (error) {
        await sendMessage(chatId, '❌ Gagal generate invoice.')
        console.error('Invoice error:', error)
    }
}
