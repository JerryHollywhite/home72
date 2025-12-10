import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    try {
        const { room_number } = await request.json()

        if (!room_number) {
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
            console.error('Room lookup failed:', roomError)
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
            console.error('Tenant lookup error:', tenantError)
            return NextResponse.json(
                { error: 'Terjadi kesalahan sistem' },
                { status: 500 }
            )
        }

        if (!tenant) {
            return NextResponse.json(
                { error: 'Kamar ini belum dihuni atau akun tidak aktif. Hubungi admin.' },
                { status: 404 }
            )
        }

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
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
