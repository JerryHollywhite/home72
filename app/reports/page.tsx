'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type Report = {
    id: string
    tenant_id: string
    message: string
    photo_url: string | null
    status: 'open' | 'in_progress' | 'done'
    created_at: string
    tenants: {
        name: string
        phone: string
        rooms: {
            room_number: string
        } | null
    } | null
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [filteredReports, setFilteredReports] = useState<Report[]>([])
    const [statusFilter, setStatusFilter] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReports()
    }, [])

    useEffect(() => {
        filterReports()
    }, [reports, statusFilter])

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/reports')
            const data = await res.json()
            setReports(data)
            setFilteredReports(data)
        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterReports = () => {
        if (statusFilter === 'all') {
            setFilteredReports(reports)
        } else {
            setFilteredReports(reports.filter((r) => r.status === statusFilter))
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/reports/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (res.ok) {
                fetchReports()
            }
        } catch (error) {
            console.error('Error updating report status:', error)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            open: { variant: 'destructive', label: 'Baru' },
            in_progress: { variant: 'secondary', label: 'Proses' },
            done: { variant: 'default', label: 'Selesai' },
        }
        const config = variants[status] || variants.open
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
                <h1 className="text-3xl font-bold text-gray-900">Pengaduan & Laporan</h1>
                <p className="text-gray-600 mt-1">Kelola pengaduan dari penyewa</p>
            </div>

            {/* Filter */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="open">Baru</SelectItem>
                            <SelectItem value="in_progress">Proses</SelectItem>
                            <SelectItem value="done">Selesai</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Penyewa</TableHead>
                                    <TableHead>Kamar</TableHead>
                                    <TableHead className="max-w-md">Pesan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell>
                                                {format(new Date(report.created_at), 'dd MMM yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{report.tenants?.name || 'N/A'}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {report.tenants?.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {report.tenants?.rooms?.room_number || 'N/A'}
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <div className="line-clamp-2">{report.message}</div>
                                                {report.photo_url && (
                                                    <button
                                                        onClick={() => window.open(report.photo_url!, '_blank')}
                                                        className="text-sm text-blue-600 hover:underline mt-1"
                                                    >
                                                        Lihat Foto
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={report.status}
                                                    onValueChange={(value) => handleStatusChange(report.id, value)}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="open">Baru</SelectItem>
                                                        <SelectItem value="in_progress">Proses</SelectItem>
                                                        <SelectItem value="done">Selesai</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Tidak ada pengaduan
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
