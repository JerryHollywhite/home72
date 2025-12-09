import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const tenant_id = formData.get('tenant_id') as string
        const month = formData.get('month') as string
        const amount = formData.get('amount') as string

        if (!file || !tenant_id || !month || !amount) {
            return NextResponse.json(
                { error: 'Data tidak lengkap' },
                { status: 400 }
            )
        }

        // Upload file to Supabase Storage
        const fileName = `${tenant_id}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return NextResponse.json(
                { error: 'Upload gagal' },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName)

        // Create or update payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                tenant_id,
                month,
                amount: parseFloat(amount),
                status: 'pending',
                payment_method: 'transfer',
                proof_url: urlData.publicUrl,
            })
            .select()
            .single()

        if (paymentError) {
            console.error('Payment record error:', paymentError)
            return NextResponse.json(
                { error: paymentError.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            payment,
            proof_url: urlData.publicUrl,
        })
    } catch (error: any) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
