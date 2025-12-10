import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/telegram/bot'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Updated to match Next.js 15+ type
) {
    const { id } = await context.params

    // Admin Only - Use Service Role
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const { action } = await request.json() // action: 'confirm' | 'cancel'

        // 1. Get Booking Detail
        const { data: booking, error: bookingError } = await supabase
            .from('booking')
            .select('*, rooms(*)')
            .eq('id', id)
            .single()

        if (bookingError || !booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        if (action === 'cancel') {
            await supabase.from('booking').update({ status: 'canceled' }).eq('id', id)
            return NextResponse.json({ success: true, status: 'canceled' })
        }

        if (action === 'confirm') {
            // Transaction-like steps

            // 2. Create Tenant
            const { data: tenant, error: tenantError } = await supabase
                .from('tenants')
                .insert({
                    name: booking.name,
                    phone: booking.phone,
                    room_id: booking.room_id,
                    start_date: booking.booking_date,
                    due_date: new Date(new Date(booking.booking_date).setMonth(new Date(booking.booking_date).getMonth() + 1)), // +1 month
                    status: 'active'
                })
                .select()
                .single()

            if (tenantError) throw new Error('Gagal membuat data tenant: ' + tenantError.message)

            // 3. Update Room Status to Occupied
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: 'occupied' })
                .eq('id', booking.room_id)

            if (roomError) throw new Error('Gagal update status kamar')

            // 4. Update Booking Status
            await supabase.from('booking').update({ status: 'confirmed' }).eq('id', id)

            // 5. Send Telegram Notification (Optional: Notify Admin or formatted message)
            if (process.env.TELEGRAM_ADMIN_CHAT_ID) {
                await sendMessage(
                    Number(process.env.TELEGRAM_ADMIN_CHAT_ID),
                    `✅ *Booking Approved!*\n\nPenyewa ${booking.name} resmi menempati Kamar ${booking.rooms?.room_number}.\nStatus kamar sekarang: Occupied.`
                )
            }

            return NextResponse.json({ success: true, status: 'confirmed' })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error: unknown) {
        console.error('Booking Action Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
