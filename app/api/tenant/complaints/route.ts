import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const tenant_id = formData.get('tenant_id') as string
        const message = formData.get('message') as string

        if (!tenant_id || !message) {
            return NextResponse.json(
                { error: 'Data tidak lengkap' },
                { status: 400 }
            )
        }

        let photo_url = null

        // Upload photo if provided
        if (file) {
            const fileName = `${tenant_id}/${Date.now()}_${file.name}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('report-photos')
                .upload(fileName, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
            } else {
                const { data: urlData } = supabase.storage
                    .from('report-photos')
                    .getPublicUrl(fileName)
                photo_url = urlData.publicUrl
            }
        }

        // Create report
        const { data: report, error } = await supabase
            .from('reports')
            .insert({
                tenant_id,
                message,
                photo_url,
                status: 'open',
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            report,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Get tenant complaints
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
        return NextResponse.json({ error: 'tenant_id required' }, { status: 400 })
    }

    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(reports || [])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
