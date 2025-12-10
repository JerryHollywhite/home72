import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/telegram/bot'

export async function GET(request: NextRequest) {
    // Keep GET using anon/RLS as it's viewing public availability
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
        .from('booking')
        .select(`
      *,
      rooms (room_number, price, facilities)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    // Use SERVICE_ROLE_KEY to insert booking (bypass RLS)
    // RLS might be preventing anon insert or immediate select
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const body = await request.json()

        const { data, error } = await supabase
            .from('booking')
            .insert(body)
            .select(`
                *,
                rooms (room_number)
            `)
            .single()

        if (error) {
            console.error('Booking Insert Error:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Send Telegram Notification
        if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
            const message = `
🔔 *Booking Baru!*

👤 Nama: ${body.name}
📱 Phone: ${body.phone}
🏠 Kamar: ${data.rooms?.room_number}
📅 Tgl Mulai: ${body.booking_date}
💰 Deposit: Rp ${Number(body.dp_amount || 0).toLocaleString('id-ID')}

Mohon cek Dashboard untuk Approval.
            `.trim()

            await sendMessage(Number(process.env.TELEGRAM_ADMIN_CHAT_ID), message, { parse_mode: 'Markdown' })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (error: any) {
        console.error('Booking General Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
