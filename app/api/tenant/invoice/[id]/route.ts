import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Add type for autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

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
            return NextResponse.json({
                error: 'Payment not found',
                details: paymentError,
                id_queried: id
            }, { status: 404 })
        }

        // 2. Get tenant details
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('*, rooms(room_number)')
            .eq('id', payment.tenant_id)
            .single()

        if (tenantError) {
            console.error('Tenant not found for invoice:', tenantError)
        }

        // Generate PDF
        const doc = new jsPDF() as jsPDFWithAutoTable

        // --- DESIGN CONSTANTS ---
        const primaryColor = '#2563EB' // Blue 600
        const secondaryColor = '#1E40AF' // Blue 800
        const accentColor = '#F3F4F6' // Gray 100
        const textColor = '#1F2937' // Gray 800
        const mutedColor = '#6B7280' // Gray 500

        // --- HEADER ---
        // Blue Top Bar
        doc.setFillColor(primaryColor)
        doc.rect(0, 0, 210, 40, 'F')

        // Company Name
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(26)
        doc.setFont('helvetica', 'bold')
        doc.text('HOME72', 15, 25)

        // Invoice Label
        doc.setFontSize(30)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text('INVOICE', 195, 28, { align: 'right' })

        // Invoice Details Box
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(200, 200, 200)
        doc.roundedRect(15, 50, 180, 35, 2, 2, 'S')

        // Invoice Number & Date
        doc.setTextColor(textColor)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        // Left Side: Bill To
        doc.setFont('helvetica', 'bold')
        doc.text('DITAGIHKAN KEPADA:', 20, 60)
        doc.setFont('helvetica', 'normal')

        if (tenant) {
            doc.text(`${tenant.name}`, 20, 66)
            doc.text(`Kamar: ${(tenant.rooms as any)?.room_number || 'N/A'}`, 20, 72)
            doc.text(`${tenant.phone}`, 20, 78)
        } else {
            doc.text('Informasi Penyewa Tidak Tersedia', 20, 66)
        }

        // Right Side: Invoice Info
        doc.setFont('helvetica', 'bold')
        doc.text('DETAIL TAGIHAN:', 120, 60)
        doc.setFont('helvetica', 'normal')
        doc.text(`No. Invoice : #${payment.id.substring(0, 8).toUpperCase()}`, 120, 66)
        doc.text(`Tanggal     : ${new Date(payment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 120, 72)

        let statusText = 'MENUNGGU VERIFIKASI'
        let statusColor = [234, 179, 8] // Yellow
        if (payment.status === 'verified') {
            statusText = 'LUNAS'
            statusColor = [22, 163, 74] // Green
        } else if (payment.status === 'rejected') {
            statusText = 'DITOLAK'
            statusColor = [220, 38, 38] // Red
        }

        doc.text('Status        : ', 120, 78)
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        doc.setFont('helvetica', 'bold')
        doc.text(statusText, 145, 78)
        doc.setTextColor(textColor) // Reset text color

        // --- TABLE ---
        const tableBody = [
            [
                `Pembayaran Sewa Periode ${payment.month}`,
                `Pembayaran via ${payment.payment_method === 'qris' ? 'QRIS' : payment.payment_method === 'transfer' ? 'Transfer Bank' : 'Cash'}`,
                `Rp ${payment.amount.toLocaleString('id-ID')}`
            ]
        ]

        doc.autoTable({
            startY: 95,
            head: [['Item / Layanan', 'Deskripsi', 'Jumlah']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: primaryColor,
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { cellWidth: 70 },
                2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
            },
            styles: {
                fontSize: 10,
                cellPadding: 5,
                valign: 'middle'
            }
        })

        // --- TOTAL ---
        const finalY = (doc as any).lastAutoTable.finalY + 10

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('TOTAL', 140, finalY)
        doc.text(`Rp ${payment.amount.toLocaleString('id-ID')}`, 195, finalY, { align: 'right' })

        // --- FOOTER & STAMP ---
        if (payment.status === 'verified') {
            // "LUNAS" Stamp
            doc.setDrawColor(22, 163, 74)
            doc.setLineWidth(1)
            doc.roundedRect(150, finalY - 50, 40, 15, 2, 2, 'D')
            doc.setTextColor(22, 163, 74)
            doc.setFontSize(12)
            doc.text('LUNAS', 170, finalY - 40, { align: 'center', angle: -10 })
        }

        // Terms
        doc.setFontSize(9)
        doc.setTextColor(mutedColor)
        doc.setFont('helvetica', 'normal')

        const pageHeight = doc.internal.pageSize.height

        doc.text('Terima kasih atas pembayaran Anda.', 15, pageHeight - 30)
        doc.text('Bukti pembayaran ini sah dan diterbitkan secara otomatis oleh sistem Home72.', 15, pageHeight - 25)

        // Bottom Line
        doc.setDrawColor(primaryColor)
        doc.setLineWidth(1)
        doc.line(0, pageHeight - 15, 210, pageHeight - 15)

        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Home72 Kosan Management System', 105, pageHeight - 10, { align: 'center' })


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
