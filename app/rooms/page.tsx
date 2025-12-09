'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Room = {
    id: string
    room_number: string
    price: number
    capacity: number
    facilities: string[]
    photos: string[]
    status: 'available' | 'occupied' | 'maintenance'
    created_at: string
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        room_number: '',
        price: '',
        capacity: '1',
        facilities: '',
        status: 'available',
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchRooms()
    }, [])

    useEffect(() => {
        filterRooms()
    }, [rooms, searchTerm, statusFilter])

    const fetchRooms = async () => {
        try {
            const res = await fetch('/api/rooms')
            const data = await res.json()
            setRooms(data)
            setFilteredRooms(data)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterRooms = () => {
        let filtered = rooms

        if (statusFilter !== 'all') {
            filtered = filtered.filter((room) => room.status === statusFilter)
        }

        if (searchTerm) {
            filtered = filtered.filter((room) =>
                room.room_number.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredRooms(filtered)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            const facilitiesArray = formData.facilities
                .split(',')
                .map((f) => f.trim())
                .filter((f) => f)

            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_number: formData.room_number,
                    price: Number(formData.price),
                    capacity: Number(formData.capacity),
                    facilities: facilitiesArray,
                    status: formData.status,
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Gagal menambahkan kamar')
            }

            setSuccess('Kamar berhasil ditambahkan!')
            fetchRooms()
            setFormData({
                room_number: '',
                price: '',
                capacity: '1',
                facilities: '',
                status: 'available',
            })
            setTimeout(() => {
                setIsDialogOpen(false)
                setSuccess('')
            }, 1500)
        } catch (error: any) {
            setError(error.message)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            available: { variant: 'default', label: 'Tersedia' },
            occupied: { variant: 'secondary', label: 'Terisi' },
            maintenance: { variant: 'destructive', label: 'Maintenance' },
        }
        const config = variants[status] || variants.available
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manajemen Kamar</h1>
                    <p className="text-gray-600 mt-1">Kelola kamar kosan Anda</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Kamar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Tambah Kamar Baru</DialogTitle>
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
                                <Label htmlFor="room_number">Nomor Kamar *</Label>
                                <Input
                                    id="room_number"
                                    placeholder="101"
                                    value={formData.room_number}
                                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Harga (Rp) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="1500000"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Kapasitas *</Label>
                                <Select
                                    value={formData.capacity}
                                    onValueChange={(value) => setFormData({ ...formData, capacity: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Orang</SelectItem>
                                        <SelectItem value="2">2 Orang</SelectItem>
                                        <SelectItem value="3">3 Orang</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facilities">Fasilitas (pisahkan dengan koma)</Label>
                                <Textarea
                                    id="facilities"
                                    placeholder="AC, Kasur, Lemari, WiFi"
                                    value={formData.facilities}
                                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Tersedia</SelectItem>
                                        <SelectItem value="occupied">Terisi</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">
                                Simpan
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari nomor kamar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="available">Tersedia</SelectItem>
                                <SelectItem value="occupied">Terisi</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                    <Card key={room.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">Kamar {room.room_number}</CardTitle>
                                {getStatusBadge(room.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Harga:</span>
                                    <span className="font-semibold">Rp {room.price.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Kapasitas:</span>
                                    <span className="font-semibold">{room.capacity} Orang</span>
                                </div>
                                {room.facilities && room.facilities.length > 0 && (
                                    <div>
                                        <span className="text-sm text-gray-600">Fasilitas:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {room.facilities.map((facility, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {facility}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredRooms.length === 0 && (
                <Card className="p-8">
                    <p className="text-center text-gray-500">Tidak ada kamar ditemukan</p>
                </Card>
            )}
        </div>
    )
}
