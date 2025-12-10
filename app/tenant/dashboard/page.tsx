'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import { id as indonesian } from 'date-fns/locale'
import {
    CreditCard,
    FileText,
    History,
    MessageSquare,
    Home,
    Calendar,
    AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { InvoiceDownloader } from '@/components/invoice-downloader'

type Tenant = {
    id: string
    name: string
    phone: string
    email: string
    room_number: string
    price: number
    facilities: string[]
    due_date: string
    telegram_connected: boolean
}

export default function TenantDashboard() {
    const router = useRouter()
    const [tenant, setTenant] = useState<Tenant | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if logged in
        const storedTenant = localStorage.getItem('home72_tenant')
        if (!storedTenant) {
            router.push('/tenant/login')
            return
        }

        setTenant(JSON.parse(storedTenant))
        setLoading(false)
    }, [router])

    const [latestPayment, setLatestPayment] = useState<any | null>(null)

    useEffect(() => {
        if (tenant?.id) {
            fetchLatestInvoice(tenant.id)
        }
    }, [tenant])

    const fetchLatestInvoice = async (tenantId: string) => {
        try {
            const res = await fetch(`/api/tenant/payment/history?tenant_id=${tenantId}`)
            const data = await res.json()
            // Find first verified payment
            const latestVerified = data.find((p: any) => p.status === 'verified')
            if (latestVerified) {
                setLatestPayment(latestVerified)
            }
        } catch (error) {
            console.error('Error fetching invoice:', error)
        }
    }

    if (loading || !tenant) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        )
    }

    const dueDate = new Date(tenant.due_date)
    const daysUntilDue = differenceInDays(dueDate, new Date())
    const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0
    const isOverdue = daysUntilDue < 0

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Selamat Datang, {tenant.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                    Kamar {tenant.room_number} • Rp {tenant.price.toLocaleString('id-ID')}/bulan
                </p>
            </div>

            {/* Due Date Alert */}
            {(isDueSoon || isOverdue) && (
                <Card className={`mb-6 border-2 ${isOverdue ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
                    <CardContent className="p-4 flex items-center space-x-3">
                        <AlertCircle className={`h-6 w-6 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                        <div>
                            <p className={`font-semibold ${isOverdue ? 'text-red-900' : 'text-yellow-900'}`}>
                                {isOverdue
                                    ? `Pembayaran Terlambat ${Math.abs(daysUntilDue)} Hari!`
                                    : `Jatuh Tempo dalam ${daysUntilDue} Hari`
                                }
                            </p>
                            <p className={`text-sm ${isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                                Tanggal: {format(dueDate, 'dd MMMM yyyy', { locale: indonesian })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Informasi Kamar</CardTitle>
                        <Home className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Nomor Kamar:</span>
                                <span className="font-semibold">{tenant.room_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Harga Sewa:</span>
                                <span className="font-semibold">
                                    Rp {tenant.price.toLocaleString('id-ID')}
                                </span>
                            </div>
                            {tenant.facilities && tenant.facilities.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-gray-600 text-sm mb-2">Fasilitas:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {tenant.facilities.map((facility, idx) => (
                                            <Badge key={idx} variant="outline">
                                                {facility}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Jadwal Pembayaran</CardTitle>
                        <Calendar className="h-5 w-5 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Jatuh Tempo:</span>
                                <span className="font-semibold">
                                    {format(dueDate, 'dd')} Setiap Bulan
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Jatuh Tempo Berikutnya:</span>
                                <span className={`font-semibold ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {format(dueDate, 'dd MMM yyyy', { locale: indonesian })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                {isOverdue ? (
                                    <Badge variant="destructive">Terlambat</Badge>
                                ) : isDueSoon ? (
                                    <Badge className="bg-yellow-600">Segera Jatuh Tempo</Badge>
                                ) : (
                                    <Badge className="bg-green-600">Aman</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/tenant/payment">
                    <Card className="hover:shadow-lg transition cursor-pointer h-full">
                        <CardContent className="p-6 text-center">
                            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                <CreditCard className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Bayar Sewa</h3>
                            <p className="text-sm text-gray-600">Upload bukti atau QRIS</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/tenant/history">
                    <Card className="hover:shadow-lg transition cursor-pointer h-full">
                        <CardContent className="p-6 text-center">
                            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                <History className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Riwayat</h3>
                            <p className="text-sm text-gray-600">Lihat pembayaran</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/tenant/complaints">
                    <Card className="hover:shadow-lg transition cursor-pointer h-full">
                        <CardContent className="p-6 text-center">
                            <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                <MessageSquare className="h-8 w-8 text-orange-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Pengaduan</h3>
                            <p className="text-sm text-gray-600">Laporkan masalah</p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className={`hover:shadow-lg transition h-full ${latestPayment ? '' : 'opacity-75'}`}>
                    <CardContent className="p-6 text-center flex flex-col items-center h-full justify-between">
                        <div>
                            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Invoice</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {latestPayment ? 'Download terbaru' : 'Belum ada invoice'}
                            </p>
                        </div>
                        {latestPayment && tenant && (
                            <InvoiceDownloader payment={latestPayment} tenant={tenant} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Telegram Connection Status */}
            {!tenant.telegram_connected && (
                <Card className="mt-8 border-blue-300 bg-blue-50">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                            <div className="bg-blue-600 rounded-full p-2">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900">
                                    Hubungkan Telegram untuk Kemudahan
                                </h3>
                                <p className="text-blue-700 text-sm mt-1">
                                    Upload bukti bayar, submit pengaduan, dan cek status langsung dari Telegram
                                </p>
                                <div className="mt-3 space-y-2">
                                    <p className="text-sm text-blue-800 font-medium">Cara connect:</p>
                                    <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                                        <li>Cari bot <strong>@Home72Bot</strong> di Telegram</li>
                                        <li>Kirim perintah /start</li>
                                        <li>Masukkan nomor kamar: <strong>{tenant.room_number}</strong></li>
                                        <li>Selesai! Gunakan /help untuk lihat perintah</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
