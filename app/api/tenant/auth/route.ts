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

        // Find active tenant with this room number
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select(`
        id,
        name,
        phone,
        email,
        room_id,
        due_date,
        telegram_chat_id,
        rooms (
          room_number,
          price,
          facilities
        )
      `)
            .eq('status', 'active')
            .eq('rooms.room_number', room_number)
            .single()

        if (error || !tenant) {
            return NextResponse.json(
                { error: 'Nomor kamar tidak ditemukan atau tidak aktif' },
                { status: 404 }
            )
        }

        // Return tenant data (in real app, you'd create a session here)
        return NextResponse.json({
            success: true,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                phone: tenant.phone,
                email: tenant.email,
                room_number: (tenant.rooms as any)?.room_number,
                price: (tenant.rooms as any)?.price,
                facilities: (tenant.rooms as any)?.facilities,
                due_date: tenant.due_date,
                telegram_connected: !!tenant.telegram_chat_id,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
