'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function InvoiceDownloader({ payment, tenant }: { payment: any, tenant: any }) {

    const handleDownload = () => {
        try {
            const doc = new jsPDF()

            // Explicitly cast to any to access autoTable from side-effect import
            const docAny = doc as any
            if (typeof docAny.autoTable !== 'function') {
                console.error('autoTable is not a function on jsPDF instance')
                alert('Gagal memuat library PDF. Silakan refresh halaman.')
                return
            }

            // --- DESIGN CONSTANTS ---
            const primaryColor = '#2563EB' // Blue 600
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
            doc.roundedRect(15, 50, 180, 40, 2, 2, 'S') // Slightly taller

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
                // Use safe optional chaining and fallback
                const roomNum = tenant.room_number || tenant.rooms?.room_number || 'N/A'
                doc.text(`Kamar: ${roomNum}`, 20, 72)
                doc.text(`${tenant.phone || '-'}`, 20, 78)
            } else {
                doc.text('Informasi Penyewa Tidak Tersedia', 20, 66)
            }

            // Right Side: Invoice Info
            doc.setFont('helvetica', 'bold')
            doc.text('DETAIL TAGIHAN:', 120, 60)
            doc.setFont('helvetica', 'normal')
            doc.text(`No. Invoice : #${(payment.id || '000').substring(0, 8).toUpperCase()}`, 120, 66)

            const dateStr = payment.created_at
                ? new Date(payment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-'
            doc.text(`Tanggal     : ${dateStr}`, 120, 72)

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
            doc.setTextColor(textColor) // Reset

            // --- TABLE ---
            const tableBody = [
                [
                    `Pembayaran Sewa Periode ${payment.month || '-'}`,
                    `Pembayaran via ${payment.payment_method === 'qris' ? 'QRIS' : payment.payment_method === 'transfer' ? 'Transfer Bank' : 'Cash'}`,
                    `Rp ${(payment.amount || 0).toLocaleString('id-ID')}`
                ]
            ]

            docAny.autoTable({
                startY: 100, // Adjusted Y
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
            const finalY = docAny.lastAutoTable.finalY + 10

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

            // Footer text
            const pageHeight = doc.internal.pageSize.height
            doc.setFontSize(9)
            doc.setTextColor(mutedColor)
            doc.setFont('helvetica', 'normal')
            doc.text('Terima kasih atas pembayaran Anda.', 15, pageHeight - 30)
            doc.text('Bukti pembayaran ini sah dan diterbitkan secara otomatis oleh sistem Home72.', 15, pageHeight - 25)

            // Bottom Line
            doc.setDrawColor(primaryColor)
            doc.setLineWidth(1)
            doc.line(0, pageHeight - 15, 210, pageHeight - 15)

            doc.save(`Invoice_${payment.month}.pdf`)

        } catch (error) {
            console.error('PDF Generation Error:', error)
            alert('Gagal mendownload PDF. Silakan coba lagi.')
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Invoice
        </Button>
    )
}
