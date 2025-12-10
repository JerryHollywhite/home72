'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { createClient } from '@supabase/supabase-js'

type Booking = {
    id: string
    name: string
    phone: string
    room_id: string
    booking_date: string
    dp_amount: number
    status: string
    created_at: string
    rooms: {
        room_number: string
        price: number
    }
}

export default function BookingsPage() {
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchBookings()
    }, [])

    const fetchBookings = async () => {
        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            const { data, error } = await supabase
                .from('booking')
                .select(`
                    *,
                    rooms (room_number, price)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setBookings(data || [])
        } catch (error) {
            console.error('Error fetching bookings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id: string, action: 'confirm' | 'cancel') => {
        if (!confirm(`Apakah Anda yakin ingin ${action === 'confirm' ? 'menyetujui' : 'menolak'} booking ini?`)) return

        try {
            const res = await fetch(`/api/booking/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Gagal memproses booking')
            }

            alert(`Booking berhasil ${action === 'confirm' ? 'disetujui' : 'ditolak'}`)
            fetchBookings()
        } catch (error: any) {
            alert(error.message)
        }
    }

    const filteredBookings = bookings.filter(booking =>
        booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone.includes(searchTerm) ||
        booking.rooms?.room_number.includes(searchTerm)
    )

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Incoming Bookings</h1>
                    <p className="text-gray-600 mt-1">Kelola booking masuk</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Daftar Booking</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Cari nama, HP, atau kamar..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Penyewa</TableHead>
                                    <TableHead>Kamar</TableHead>
                                    <TableHead>Tgl Masuk</TableHead>
                                    <TableHead>Deposit</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredBookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            Tidak ada data booking
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>
                                                {new Date(booking.created_at).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{booking.name}</div>
                                                <div className="text-xs text-gray-500">{booking.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Kamar {booking.rooms?.room_number}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(booking.booking_date).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                Rp {booking.dp_amount.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        booking.status === 'confirmed' ? 'default' :
                                                            booking.status === 'canceled' ? 'destructive' : 'secondary'
                                                    }
                                                >
                                                    {booking.status === 'confirmed' ? 'Diterima' :
                                                        booking.status === 'canceled' ? 'Ditolak' : 'Menunggu'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleAction(booking.id, 'confirm')}
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleAction(booking.id, 'cancel')}
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
