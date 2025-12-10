import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use Service Role to allow public upload to specific bucket without complex RLS
// (Or we can use Anon key if policy allows "Anyone can insert")
// Let's use Service Role to be safe against policy misconfiguration, 
// but ensure validation is strict hereunder.

export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        // Validate file size (e.g., max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `bookings/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })
    } catch (error: unknown) {
        console.error('Upload Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
