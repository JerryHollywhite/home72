import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    params: { params: Promise<{ id: string }> } // Correct type for Next.js 15+
) {
    try {
        const { id } = await params.params // Next.js 15 unwrapping

        console.log('Generating invoice for:', id)

        // 1. Get payment details
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('id', id)
            .single()

        if (paymentError || !payment) {
            console.error('Payment not found:', paymentError)
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // 2. Get tenant details
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*, rooms(room_number)')
            .eq('id', payment.tenant_id)
            .single()

        if (tenantError) {
            console.error('Tenant not found for invoice:', tenantError)
            // Continue with limited info if tenant not found
        }

        // Generate PDF
        const doc = new jsPDF()

        // Header
        doc.setFillColor(37, 99, 235) // Blue
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.text('HOME72', 20, 20)
        doc.setFontSize(12)
        doc.text('Invoice Pembayaran Sewa Kamar', 20, 30)

        // Invoice Info
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.text(`Invoice ID: ${payment.id.substring(0, 8)}...`, 20, 55)
        doc.text(`Tanggal: ${new Date(payment.created_at).toLocaleDateString('id-ID')}`, 20, 62)

        // Tenant Info
        doc.setFontSize(12)
        doc.text('Informasi Penyewa:', 20, 75)
        doc.setFontSize(10)
        if (tenant) {
            doc.text(`Nama: ${tenant.name}`, 20, 82)
            doc.text(`Kamar: ${(tenant.rooms as any)?.room_number || 'N/A'}`, 20, 89)
            doc.text(`Telepon: ${tenant.phone}`, 20, 96)
        } else {
            doc.text('Pelanggan: Informasi tidak tersedia', 20, 82)
        }

        // Payment Details
        doc.setFontSize(12)
        doc.text('Detail Pembayaran:', 20, 115)
        doc.setFontSize(10)
        doc.text(`Periode: ${payment.month}`, 20, 122)
        doc.text(`Metode: ${payment.payment_method === 'qris' ? 'QRIS' : payment.payment_method === 'transfer' ? 'Transfer Bank' : 'Cash'}`, 20, 129)
        doc.text(`Jumlah: Rp ${payment.amount.toLocaleString('id-ID')}`, 20, 136)

        let statusLabel = 'Menunggu Verifikasi'
        if (payment.status === 'verified') statusLabel = 'LUNAS / TERVERIFIKASI'
        if (payment.status === 'rejected') statusLabel = 'DITOLAK'

        doc.text(`Status: ${statusLabel}`, 20, 143)

        if (payment.verified_at) {
            doc.text(`Diverifikasi: ${new Date(payment.verified_at).toLocaleDateString('id-ID')}`, 20, 150)
        }

        // Add Stamp/Signature placeholder for verified
        if (payment.status === 'verified') {
            doc.setDrawColor(37, 99, 235)
            doc.setLineWidth(1)
            doc.rect(140, 110, 50, 20)
            doc.setTextColor(37, 99, 235)
            doc.setFontSize(10)
            doc.text('LUNAS', 150, 122)
        }

        // Footer
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text('Home72 Kosan - Sistem Manajemen Kosan Modern', 20, 280)
        doc.text('Generated: ' + new Date().toLocaleString('id-ID'), 20, 285)

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer')

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoice_${payment.month}.pdf"`,
            },
        })
    } catch (error: any) {
        console.error('PDF generation error:', error)
        return NextResponse.json(
            {
                error: 'Invoice Generation Failed',
                details: error.message,
                stack: error.stack
            },
            { status: 500 }
        )
    }
}
