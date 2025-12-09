'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type Payment = {
    id: string
    tenant_id: string
    month: string
    amount: number
    status: 'pending' | 'verified' | 'rejected'
    proof_url: string | null
    pay_date: string | null
    tenants: {
        name: string
        rooms: {
            room_number: string
        } | null
    } | null
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        fetchPayments()
    }, [])

    useEffect(() => {
        filterPayments()
    }, [payments, statusFilter])

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/payments')
            const data = await res.json()
            setPayments(data)
            setFilteredPayments(data)
        } catch (error) {
            console.error('Error fetching payments:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterPayments = () => {
        if (statusFilter === 'all') {
            setFilteredPayments(payments)
        } else {
            setFilteredPayments(payments.filter((p) => p.status === statusFilter))
        }
    }

    const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
        try {
            const res = await fetch('/api/payments/verify', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            })

            if (res.ok) {
                fetchPayments()
                setIsDialogOpen(false)
            }
        } catch (error) {
            console.error('Error verifying payment:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            pending: { variant: 'secondary', label: 'Pending' },
            verified: { variant: 'default', label: 'Terverifikasi' },
            rejected: { variant: 'destructive', label: 'Ditolak' },
        }
        const config = variants[status] || variants.pending
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Manajemen Pembayaran</h1>
                <p className="text-gray-600 mt-1">Verifikasi pembayaran penyewa</p>
            </div>

            {/* Filter */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="verified">Terverifikasi</SelectItem>
                                <SelectItem value="rejected">Ditolak</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Penyewa</TableHead>
                                    <TableHead>Kamar</TableHead>
                                    <TableHead>Bulan</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length > 0 ? (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {payment.tenants?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {payment.tenants?.rooms?.room_number || 'N/A'}
                                            </TableCell>
                                            <TableCell>{payment.month}</TableCell>
                                            <TableCell className="font-semibold">
                                                Rp {payment.amount.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell>
                                                {payment.status === 'pending' && payment.proof_url && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedPayment(payment)
                                                            setIsDialogOpen(true)
                                                        }}
                                                    >
                                                        Verifikasi
                                                    </Button>
                                                )}
                                                {payment.proof_url && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => window.open(payment.proof_url!, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Tidak ada data pembayaran
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Verification Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifikasi Pembayaran</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Penyewa</p>
                                <p className="font-medium">{selectedPayment.tenants?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Kamar</p>
                                <p className="font-medium">
                                    Kamar {selectedPayment.tenants?.rooms?.room_number}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Bulan</p>
                                <p className="font-medium">{selectedPayment.month}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Jumlah</p>
                                <p className="font-medium text-lg">
                                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                                </p>
                            </div>
                            {selectedPayment.proof_url && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Bukti Transfer</p>
                                    <img
                                        src={selectedPayment.proof_url}
                                        alt="Bukti transfer"
                                        className="w-full rounded-lg border"
                                    />
                                </div>
                            )}
                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleVerify(selectedPayment.id, 'verified')}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Verifikasi
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="destructive"
                                    onClick={() => handleVerify(selectedPayment.id, 'rejected')}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Tolak
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
