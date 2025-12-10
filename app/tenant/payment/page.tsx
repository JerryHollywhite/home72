'use client'

import { useEffect, useState } from 'react'

export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { QrCode, Upload, CreditCard, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function PaymentPage() {
    const router = useRouter()
    const [tenant, setTenant] = useState<any>(null)
    const [qrCode, setQrCode] = useState('')
    const [qrExpiry, setQrExpiry] = useState<Date | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        const storedTenant = localStorage.getItem('home72_tenant')
        if (!storedTenant) {
            router.push('/tenant/login')
            return
        }
        setTenant(JSON.parse(storedTenant))
    }, [router])

    const handleGenerateQRIS = async () => {
        if (!tenant) return
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/tenant/payment/qris', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenant.id,
                    amount: tenant.price,
                    month,
                }),
            })

            if (!res.ok) throw new Error('Gagal generate QRIS')

            const data = await res.json()
            setQrCode(data.qr_code)
            setQrExpiry(new Date(data.expires_at))
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as string)
            reader.readAsDataURL(selectedFile)
        }
    }

    const handleUploadProof = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file || !tenant) return

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('tenant_id', tenant.id)
            formData.append('month', month)
            formData.append('amount', tenant.price.toString())

            const res = await fetch('/api/tenant/payment/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Gagal upload')

            setSuccess('Bukti bayar berhasil dikirim! Tunggu verifikasi admin.')
            setFile(null)
            setPreview(null)

            setTimeout(() => router.push('/tenant/history'), 2000)
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!tenant) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>
    }

    const currentMonth = format(new Date(), 'yyyy-MM')
    const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        return format(date, 'yyyy-MM')
    })

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Bayar Sewa Kamar</h1>
                <p className="text-gray-600 mt-1">
                    Kamar {tenant.room_number} • Rp {tenant.price.toLocaleString('id-ID')}/bulan
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="mb-6">
                    <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="bank" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Info Rekening
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Bukti
                    </TabsTrigger>
                </TabsList>

                {/* Bank Account Tab */}
                <TabsContent value="bank">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer ke Rekening</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-6 shadow-lg">
                                <div className="flex items-center space-x-3 mb-4">
                                    <CreditCard className="h-8 w-8" />
                                    <div>
                                        <p className="text-sm text-blue-100">Transfer ke</p>
                                        <p className="text-xl font-bold">SEABANK</p>
                                    </div>
                                </div>

                                <div className="space-y-3 bg-white/10 rounded-lg p-4 backdrop-blur">
                                    <div>
                                        <p className="text-xs text-blue-100">Nomor Rekening</p>
                                        <p className="text-2xl font-mono font-bold tracking-wider">
                                            9012 9691 8816
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-100">Atas Nama</p>
                                        <p className="text-xl font-semibold">Heriyanto</p>
                                    </div>
                                    <div className="border-t border-white/20 pt-3 mt-3">
                                        <p className="text-xs text-blue-100">Jumlah Transfer</p>
                                        <p className="text-3xl font-bold">
                                            Rp {tenant.price.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                                <p className="font-semibold text-yellow-900 mb-2">⚠️ Penting:</p>
                                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                                    <li>Transfer sesuai jumlah yang tertera</li>
                                    <li>Screenshot bukti transfer</li>
                                    <li>Upload bukti di tab "Upload Bukti"</li>
                                </ul>
                            </div>

                            <Button
                                onClick={() => {
                                    navigator.clipboard.writeText('9012969188816')
                                    alert('Nomor rekening berhasil dicopy!')
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                📋 Copy Nomor Rekening
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Upload Tab */}
                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Bukti Transfer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUploadProof} className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="font-semibold text-blue-900 mb-3">Transfer ke Rekening:</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Bank:</span>
                                            <span className="font-bold text-blue-900">SEABANK</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">No. Rekening:</span>
                                            <span className="font-mono font-bold text-blue-900">9012 9691 8816</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-700">Atas Nama:</span>
                                            <span className="font-bold text-blue-900">Heriyanto</span>
                                        </div>
                                        <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between">
                                            <span className="text-blue-700">Jumlah:</span>
                                            <span className="text-lg font-bold text-blue-900">
                                                Rp {tenant.price.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Bulan Pembayaran</Label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {format(new Date(m + '-01'), 'MMMM yyyy')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Bukti Transfer *</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                        {preview ? (
                                            <div className="space-y-4">
                                                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setFile(null)
                                                        setPreview(null)
                                                    }}
                                                >
                                                    Ganti Foto
                                                </Button>
                                            </div>
                                        ) : (
                                            <label htmlFor="file" className="cursor-pointer block">
                                                <div className="flex flex-col items-center space-y-2">
                                                    <Upload className="h-12 w-12 text-gray-400" />
                                                    <span className="text-gray-600">Klik untuk upload bukti transfer</span>
                                                    <span className="text-sm text-gray-500">PNG, JPG hingga 5MB</span>
                                                </div>
                                                <input
                                                    id="file"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    required
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading || !file}>
                                    {loading ? 'Uploading...' : 'Kirim Bukti Bayar'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
