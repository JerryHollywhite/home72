'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id as indonesian } from 'date-fns/locale'
import { Download, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

type Payment = {
    id: string
    month: string
    amount: number
    status: string
    payment_method: string
    created_at: string
    verified_at: string | null
}

export default function PaymentHistoryPage() {
    const router = useRouter()
    const [tenant, setTenant] = useState<any>(null)
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const storedTenant = localStorage.getItem('home72_tenant')
        if (!storedTenant) {
            router.push('/tenant/login')
            return
        }

        const tenantData = JSON.parse(storedTenant)
        setTenant(tenantData)
        fetchPayments(tenantData.id)
    }, [router])

    const fetchPayments = async (tenantId: string) => {
        try {
            const res = await fetch(`/api/tenant/payment/history?tenant_id=${tenantId}`)
            const data = await res.json()
            setPayments(data)
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadInvoice = async (paymentId: string) => {
        try {
            const res = await fetch(`/api/tenant/invoice/${paymentId}`)
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Invoice_${paymentId}.pdf`
            a.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error downloading invoice:', error)
            alert('Gagal download invoice')
        }
    }

    const getStatusBadge = (status: string) => {
        const config = {
            verified: { icon: CheckCircle, variant: 'default' as const, label: 'Terverifikasi' },
            pending: { icon: Clock, variant: 'secondary' as const, label: 'Pending' },
            rejected: { icon: XCircle, variant: 'destructive' as const, label: 'Ditolak' },
        }
        const { icon: Icon, variant, label } = config[status as keyof typeof config] || config.pending

        return (
            <Badge variant={variant} className="flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        )
    }

    if (loading || !tenant) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Riwayat Pembayaran</h1>
                <p className="text-gray-600 mt-1">Kamar {tenant.room_number}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Semua Pembayaran</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Bulan</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Metode</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.month}</TableCell>
                                            <TableCell>Rp {payment.amount.toLocaleString('id-ID')}</TableCell>
                                            <TableCell className="capitalize">{payment.payment_method}</TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell>
                                                {format(new Date(payment.created_at), 'dd MMM yyyy', { locale: indonesian })}
                                            </TableCell>
                                            <TableCell>
                                                {payment.status === 'verified' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDownloadInvoice(payment.id)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Invoice
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Belum ada riwayat pembayaran
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
