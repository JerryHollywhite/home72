import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
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
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Missing required fields: id, status' },
                { status: 400 }
            )
        }

        const updateData: any = { status }
        if (status === 'verified') {
            updateData.verified_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('id', id)
            .select(`
        *,
        tenants (
          name,
          email,
          rooms (room_number, price)
        )
      `)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // TODO: Send email notification
        // if (status === 'verified' && data.tenants?.email) {
        //   await sendPaymentVerifiedEmail(data)
        // }

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
