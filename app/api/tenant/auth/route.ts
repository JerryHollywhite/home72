import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    // Info: Use service role key to bypass RLS for "occupied" rooms and tenant lookup
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const body = await request.json()
        const raw_room_number = body.room_number

        // Sanitize input
        const room_number = String(raw_room_number || '').trim()

        console.log(`[Tenant Auth] Attempting login for room: "${room_number}" (raw: "${raw_room_number}")`)

        if (!room_number) {
            console.warn('[Tenant Auth] Missing room number')
            return NextResponse.json(
                { error: 'Nomor kamar diperlukan' },
                { status: 400 }
            )
        }

        // 1. Find the room first (Reliable approach)
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('id, room_number, price, facilities')
            .eq('room_number', room_number)
            .single()

        if (roomError || !room) {
            console.error(`[Tenant Auth] Room lookup failed for "${room_number}":`, roomError)
            return NextResponse.json(
                { error: 'Nomor kamar tidak ditemukan' },
                { status: 404 }
            )
        }

        // 2. Find active tenant for this room
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, phone, email, due_date, telegram_chat_id')
            .eq('room_id', room.id)
            .eq('status', 'active')
            .maybeSingle() // Use maybeSingle to handle empty result gracefully

        if (tenantError) {
            console.error('[Tenant Auth] Tenant lookup error:', tenantError)
            return NextResponse.json(
                { error: 'Terjadi kesalahan sistem saat mencari data penyewa' },
                { status: 500 }
            )
        }

        if (!tenant) {
            console.warn(`[Tenant Auth] No active tenant found for room "${room_number}" (ID: ${room.id})`)
            return NextResponse.json(
                { error: 'Kamar ini belum dihuni atau akun tidak aktif. Hubungi admin.' },
                { status: 404 }
            )
        }

        console.log(`[Tenant Auth] Login successful for ${tenant.name} (Room ${room_number})`)

        // Return tenant data combined with room data
        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                phone: tenant.phone,
                email: tenant.email,
                room_number: room.room_number,
                price: room.price,
                facilities: room.facilities,
                due_date: tenant.due_date,
                telegram_connected: !!tenant.telegram_chat_id,
            },
        })
    } catch (error: any) {
        console.error('[Tenant Auth] Unexpected error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
