import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        // Get payment with tenant info
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
        *,
        tenants (
          name,
          phone,
          email,
          rooms (
            room_number
          )
        )
      `)
            .eq('id', id)
            .single()

        if (error || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
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
        doc.text(`Invoice ID: ${payment.id}`, 20, 55)
        doc.text(`Tanggal: ${new Date(payment.created_at).toLocaleDateString('id-ID')}`, 20, 62)

        // Tenant Info
        doc.setFontSize(12)
        doc.text('Informasi Penyewa:', 20, 75)
        doc.setFontSize(10)
        doc.text(`Nama: ${(payment.tenants as any)?.name || 'N/A'}`, 20, 82)
        doc.text(`Kamar: ${(payment.tenants as any)?.rooms?.room_number || 'N/A'}`, 20, 89)
        doc.text(`Telepon: ${(payment.tenants as any)?.phone || 'N/A'}`, 20, 96)

        // Payment Details
        doc.setFontSize(12)
        doc.text('Detail Pembayaran:', 20, 115)
        doc.setFontSize(10)
        doc.text(`Periode: ${payment.month}`, 20, 122)
        doc.text(`Metode: ${payment.payment_method === 'qris' ? 'QRIS' : payment.payment_method === 'transfer' ? 'Transfer Bank' : 'Cash'}`, 20, 129)
        doc.text(`Jumlah: Rp ${payment.amount.toLocaleString('id-ID')}`, 20, 136)
        doc.text(`Status: ${payment.status === 'verified' ? 'Terverifikasi' : payment.status === 'pending' ? 'Menunggu Verifikasi' : 'Ditolak'}`, 20, 143)

        if (payment.verified_at) {
            doc.text(`Diverifikasi: ${new Date(payment.verified_at).toLocaleDateString('id-ID')}`, 20, 150)
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
                'Content-Disposition': `attachment; filename="Invoice_${payment.month}_${(payment.tenants as any)?.rooms?.room_number}.pdf"`,
            },
        })
    } catch (error: any) {
        console.error('PDF generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
