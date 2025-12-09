'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TenantLoginPage() {
    const router = useRouter()
    const [roomNumber, setRoomNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/tenant/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_number: roomNumber }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Login gagal')
            }

            // Store tenant data in localStorage
            localStorage.setItem('home72_tenant', JSON.stringify(data.tenant))

            // Redirect to tenant dashboard
            router.push('/tenant/dashboard')
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-full">
                            <DoorOpen className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        Portal Penyewa
                    </CardTitle>
                    <p className="text-gray-600 mt-2">Home72 Kosan</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="room_number">Nomor Kamar</Label>
                            <Input
                                id="room_number"
                                type="text"
                                placeholder="Contoh: 103"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                required
                                className="text-lg h-12"
                            />
                            <p className="text-sm text-gray-500">
                                Masukkan nomor kamar Anda untuk akses portal
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700"
                            disabled={loading}
                        >
                            {loading ? 'Memverifikasi...' : 'Masuk'}
                        </Button>

                        <div className="text-center text-sm text-gray-600">
                            <p>Kesulitan akses?</p>
                            <p className="mt-1">Hubungi admin kosan Anda</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
