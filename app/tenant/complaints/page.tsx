'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ImageIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

type Complaint = {
    id: string
    message: string
    photo_url: string | null
    status: string
    created_at: string
    updated_at: string
}

export default function ComplaintsPage() {
    const router = useRouter()
    const [tenant, setTenant] = useState<any>(null)
    const [complaints, setComplaints] = useState<Complaint[]>([])
    const [message, setMessage] = useState('')
    const [photo, setPhoto] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        const storedTenant = localStorage.getItem('home72_tenant')
        if (!storedTenant) {
            router.push('/tenant/login')
            return
        }

        const tenantData = JSON.parse(storedTenant)
        setTenant(tenantData)
        fetchComplaints(tenantData.id)
    }, [router])

    const fetchComplaints = async (tenantId: string) => {
        try {
            const res = await fetch(`/api/tenant/complaints?tenant_id=${tenantId}`)
            const data = await res.json()
            setComplaints(data)
        } catch (error) {
            console.error('Error fetching complaints:', error)
        }
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) {
            setError('Pesan tidak boleh kosong')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const formData = new FormData()
            formData.append('tenant_id', tenant.id)
            formData.append('message', message)
            if (photo) {
                formData.append('file', photo)
            }

            const res = await fetch('/api/tenant/complaints', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Gagal submit pengaduan')

            setSuccess('Pengaduan berhasil dikirim!')
            setMessage('')
            setPhoto(null)
            setPreview(null)
            fetchComplaints(tenant.id)

            setTimeout(() => setSuccess(''), 3000)
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            open: { variant: 'destructive' as const, label: 'Baru' },
            in_progress: { variant: 'secondary' as const, label: 'Proses' },
            done: { variant: 'default' as const, label: 'Selesai' },
        }
        const { variant, label } = variants[status as keyof typeof variants] || variants.open
        return <Badge variant={variant}>{label}</Badge>
    }

    if (!tenant) {
        return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Pengaduan & Keluhan</h1>
                <p className="text-gray-600 mt-1">Laporkan masalah atau keluhan Anda</p>
            </div>

            {/* Submit Form */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Submit Pengaduan Baru</CardTitle>
                </CardHeader>
                <CardContent>
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
                            <Label htmlFor="message">Deskripsi Masalah *</Label>
                            <Textarea
                                id="message"
                                placeholder="Jelaskan masalah yang Anda alami..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="photo">Foto (Opsional)</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                {preview ? (
                                    <div className="space-y-4">
                                        <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setPhoto(null)
                                                setPreview(null)
                                            }}
                                        >
                                            Hapus Foto
                                        </Button>
                                    </div>
                                ) : (
                                    <label htmlFor="photo" className="cursor-pointer">
                                        <div className="flex flex-col items-center space-y-2">
                                            <ImageIcon className="h-12 w-12 text-gray-400" />
                                            <span className="text-gray-600">Klik untuk upload foto</span>
                                            <span className="text-sm text-gray-500">PNG, JPG hingga 5MB</span>
                                        </div>
                                        <input
                                            id="photo"
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            <Upload className="h-4 w-4 mr-2" />
                            {loading ? 'Mengirim...' : 'Kirim Pengaduan'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Complaints History */}
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Pengaduan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {complaints.length > 0 ? (
                            complaints.map((complaint) => (
                                <div key={complaint.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">
                                                {new Date(complaint.created_at).toLocaleDateString('id-ID', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        {getStatusBadge(complaint.status)}
                                    </div>
                                    <p className="text-gray-900 mb-3">{complaint.message}</p>
                                    {complaint.photo_url && (
                                        <img
                                            src={complaint.photo_url}
                                            alt="Complaint photo"
                                            className="max-h-48 rounded cursor-pointer"
                                            onClick={() => window.open(complaint.photo_url!, '_blank')}
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">Belum ada pengaduan</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
