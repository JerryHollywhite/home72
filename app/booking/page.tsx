'use client'

import { useEffect, useState } from 'react'
import { DoorOpen, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Room = {
    id: string
    room_number: string
    price: number
    capacity: number
    facilities: string[]
    photos: string[]
    status: string
}

export default function BookingPage() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        booking_date: '',
        dp_amount: '',
    })
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        fetchAvailableRooms()
    }, [])

    const fetchAvailableRooms = async () => {
        try {
            const res = await fetch('/api/rooms?status=available')
            const data = await res.json()
            setRooms(data)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleBooking = (room: Room) => {
        setSelectedRoom(room)
        setFormData({
            ...formData,
            dp_amount: room.price.toString(), // Full 1 Month Deposit
        })
        setIsDialogOpen(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0])
        }
    }

    const uploadProof = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)

        // Use a dedicated upload API to handle storage securely
        const res = await fetch('/api/booking/upload', {
            method: 'POST',
            body: formData
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Gagal upload bukti bayar')
        }

        const data = await res.json()
        return data.url
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!selectedRoom) return
        if (!proofFile) {
            setError('Mohon upload bukti transfer terlebih dahulu')
            return
        }

        try {
            setUploading(true)

            // 1. Upload Proof
            const proofUrl = await uploadProof(proofFile)

            // 2. Create Booking
            const res = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    room_id: selectedRoom.id,
                    booking_date: formData.booking_date,
                    dp_amount: Number(formData.dp_amount),
                    proof_url: proofUrl
                }),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Gagal membuat booking')
            }

            setSuccess('Booking berhasil! Kami akan segera menghubungi Anda.')
            setFormData({
                name: '',
                phone: '',
                booking_date: '',
                dp_amount: '',
            })
            setProofFile(null)
            setTimeout(() => {
                setIsDialogOpen(false)
                setSuccess('')
            }, 2000)
        } catch (error: any) {
            setError(error.message)
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <DoorOpen className="h-16 w-16" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Home72</h1>
                        <p className="text-xl text-blue-100">
                            Booking Kamar Kosan Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Available Rooms */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        Kamar Tersedia
                    </h2>
                    <p className="text-gray-600">
                        Pilih kamar yang sesuai dengan kebutuhan Anda
                    </p>
                </div>

                {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <Card key={room.id} className="hover:shadow-xl transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-2xl">Kamar {room.room_number}</CardTitle>
                                        <Badge className="bg-green-600">Tersedia</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-bold text-blue-600">
                                            Rp {room.price.toLocaleString('id-ID')}
                                            <span className="text-sm text-gray-600 font-normal">/bulan</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center text-gray-600">
                                        <Users className="h-5 w-5 mr-2" />
                                        <span>Kapasitas: {room.capacity} Orang</span>
                                    </div>

                                    {room.facilities && room.facilities.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-gray-700 mb-2">Fasilitas:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {room.facilities.map((facility, idx) => (
                                                    <Badge key={idx} variant="outline">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        {facility}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                        onClick={() => handleBooking(room)}
                                    >
                                        Booking Sekarang
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-12">
                        <p className="text-center text-gray-500 text-lg">
                            Maaf, saat ini tidak ada kamar yang tersedia
                        </p>
                    </Card>
                )}
            </div>

            {/* Booking Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Booking Kamar {selectedRoom?.room_number}
                        </DialogTitle>
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

                        <div>
                            <p className="text-sm text-gray-600">Harga Sewa</p>
                            <p className="text-2xl font-bold text-blue-600">
                                Rp {selectedRoom?.price.toLocaleString('id-ID')}/bulan
                            </p>
                        </div>

                        {/* Deposit Rule */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 font-medium mb-1">Syarat & Ketentuan Booking:</p>
                            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                                <li>Deposit wajib <strong>1 Bulan Sewa</strong> (Rp {selectedRoom?.price.toLocaleString('id-ID')}).</li>
                                <li>Deposit ini akan <strong>dikembalikan utuh</strong> saat checkout (jika tidak ada kerusakan).</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Masukkan nama lengkap Anda"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Nomor HP/WhatsApp *</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                required
                                placeholder="0812xxxxxxxx"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="booking_date">Tanggal Mulai *</Label>
                            <Input
                                id="booking_date"
                                type="date"
                                value={formData.booking_date}
                                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Payment Info */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                            <p className="text-sm font-semibold text-blue-900">Silakan Transfer Pembayaran:</p>
                            <div className="text-blue-800">
                                <p className="text-xs text-blue-600">Bank Transfer</p>
                                <p className="font-bold text-lg font-mono">BCA 1234567890</p>
                                <p className="text-sm">a.n Home72 Management</p>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs text-blue-700">Total yang harus ditransfer:</p>
                                <p className="text-xl font-bold text-blue-900">
                                    Rp {selectedRoom?.price.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[10px] text-blue-600 italic">
                                    (1 Bulan Sewa sebagai Deposit)
                                </p>
                            </div>
                        </div>

                        {/* Payment Proof Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="proof">Bukti Transfer (Wajib) *</Label>
                            <Input
                                id="proof"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required
                                className="cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">
                                Upload foto/screenshot bukti transfer.
                            </p>
                        </div>

                        {(uploading || loading) ? (
                            <Button disabled className="w-full">
                                {uploading ? 'Mengupload Bukti...' : 'Memproses...'}
                            </Button>
                        ) : (
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                Konfirmasi & Kirim Bukti Booking
                            </Button>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <div className="bg-gray-900 text-white py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="font-semibold text-lg">Home72</p>
                    <p className="text-gray-400 mt-2">© {new Date().getFullYear()} Home72. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
