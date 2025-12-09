import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { tenant_id, amount, month } = await request.json()

        if (!tenant_id || !amount || !month) {
            return NextResponse.json(
                { error: 'Data tidak lengkap' },
                { status: 400 }
            )
        }

        // Generate mock QRIS string (in production, call payment gateway API)
        const qrisString = `00020101021126690014ID.CO.QRIS.WWW0215ID${Date.now()}0303UMI51440014ID.CO.BCA.WWW02150857239320102030303UKE520454995303360540${amount}5802ID5909HOME72INA6007JAKARTA61051234062230121PLN01092${Date.now()}63044B9A`

        // Generate QR Code image
        const qrCodeDataUrl = await QRCode.toDataURL(qrisString, {
            width: 300,
            margin: 1,
        })

        // Set expiry time (15 minutes from now)
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 15)

        // Create payment record with pending status
        const { data: payment, error } = await supabase
            .from('payments')
            .insert({
                tenant_id,
                month,
                amount,
                status: 'pending',
                payment_method: 'qris',
                qris_url: qrCodeDataUrl,
                qris_expired_at: expiresAt.toISOString(),
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating payment:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            payment_id: payment.id,
            qr_code: qrCodeDataUrl,
            expires_at: expiresAt.toISOString(),
            amount,
        })
    } catch (error: any) {
        console.error('QRIS generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Check QRIS payment status (mock for now)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('payment_id')

    if (!paymentId) {
        return NextResponse.json({ error: 'payment_id required' }, { status: 400 })
    }

    try {
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single()

        if (error || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // In production, check with payment gateway
        // For now, mock: payment stays pending until admin verifies
        return NextResponse.json({
            status: payment.status,
            verified_at: payment.verified_at,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
