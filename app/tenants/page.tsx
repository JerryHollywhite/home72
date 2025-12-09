'use client'

import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Tenant = {
    id: string
    name: string
    phone: string
    email: string | null
    room_id: string | null
    start_date: string
    due_date: string
    status: 'active' | 'inactive'
    rooms: { room_number: string; price: number } | null
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        room_id: '',
        start_date: '',
        due_date: '',
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchTenants()
        fetchAvailableRooms()
    }, [])

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/tenants')
            const data = await res.json()
            setTenants(data)
        } catch (error) {
            console.error('Error fetching tenants:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchAvailableRooms = async () => {
        try {
            const res = await fetch('/api/rooms?status=available')
            const data = await res.json()
            setRooms(data)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    status: 'active',
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Gagal menambahkan penyewa')
            }

            setSuccess('Penyewa berhasil ditambahkan!')
            fetchTenants()
            fetchAvailableRooms()
            setFormData({
                name: '',
                phone: '',
                email: '',
                room_id: '',
                start_date: '',
                due_date: '',
            })
            setTimeout(() => {
                setIsDialogOpen(false)
                setSuccess('')
            }, 1500)
        } catch (error: any) {
            setError(error.message)
        }
    }

    const filteredTenants = tenants.filter((tenant) =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.phone.includes(searchTerm) ||
        tenant.rooms?.room_number.includes(searchTerm)
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen Penyewa</h1>
                    <p className="text-gray-600 mt-1">Kelola data penyewa kosan</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Penyewa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tambah Penyewa Baru</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert>
                                    <AlertDescription className="text-green-600">{success}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Nomor HP *</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="room">Kamar *</Label>
                                <Select
                                    value={formData.room_id}
                                    onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kamar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.length > 0 ? (
                                            rooms.map((room) => (
                                                <SelectItem key={room.id} value={room.id}>
                                                    Kamar {room.room_number} - Rp {room.price.toLocaleString('id-ID')}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="" disabled>
                                                Tidak ada kamar tersedia
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Tanggal Mulai *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Tanggal Jatuh Tempo *</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={rooms.length === 0}>
                                Simpan
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari nama, nomor HP, atau nomor kamar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Tenants Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Kamar</TableHead>
                                    <TableHead>Mulai</TableHead>
                                    <TableHead>Jatuh Tempo</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTenants.length > 0 ? (
                                    filteredTenants.map((tenant) => (
                                        <TableRow key={tenant.id}>
                                            <TableCell className="font-medium">{tenant.name}</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{tenant.phone}</div>
                                                    {tenant.email && (
                                                        <div className="text-gray-500">{tenant.email}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {tenant.rooms ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            Kamar {tenant.rooms.room_number}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Rp {tenant.rooms.price.toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(tenant.start_date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(tenant.due_date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                >
                                                    {tenant.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            Tidak ada data penyewa
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
