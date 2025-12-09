import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DoorOpen, Users, CreditCard, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

async function getDashboardData() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Get total rooms
    const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

    // Get available rooms
    const { count: availableRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'available')

    // Get active tenants
    const { count: activeTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

    // Get this month's revenue (verified payments only)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'verified')
        .like('month', `${currentMonth}%`)

    const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0

    // Get pending reports
    const { count: pendingReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'done')

    // Get recent payments
    const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
      *,
      tenants (
        name,
        rooms (room_number)
      )
    `)
        .order('created_at', { ascending: false })
        .limit(5)

    // Get pending bookings
    const { count: pendingBookings } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

    return {
        totalRooms: totalRooms || 0,
        availableRooms: availableRooms || 0,
        activeTenants: activeTenants || 0,
        monthlyRevenue,
        pendingReports: pendingReports || 0,
        pendingBookings: pendingBookings || 0,
        recentPayments: recentPayments || [],
    }
}

export default async function DashboardPage() {
    const data = await getDashboardData()
    const occupancyRate = data.totalRooms > 0
        ? Math.round(((data.totalRooms - data.availableRooms) / data.totalRooms) * 100)
        : 0

    const stats = [
        {
            title: 'Total Kamar',
            value: data.totalRooms,
            icon: DoorOpen,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Kamar Tersedia',
            value: data.availableRooms,
            icon: DoorOpen,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Penyewa Aktif',
            value: data.activeTenants,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Pendapatan Bulan Ini',
            value: `Rp ${data.monthlyRevenue.toLocaleString('id-ID')}`,
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ]

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Selamat datang di Home72 Management System</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                                        <Icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Tingkat Okupansi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-4xl font-bold text-blue-600">{occupancyRate}%</span>
                            <Badge variant={occupancyRate > 70 ? 'default' : 'secondary'}>
                                {occupancyRate > 70 ? 'Baik' : 'Rendah'}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                            {data.totalRooms - data.availableRooms} dari {data.totalRooms} kamar terisi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifikasi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.pendingReports > 0 && (
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-medium">Pengaduan Pending</span>
                                <Badge variant="outline" className="bg-yellow-100">{data.pendingReports}</Badge>
                            </div>
                        )}
                        {data.pendingBookings > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium">Booking Baru</span>
                                <Badge variant="outline" className="bg-blue-100">{data.pendingBookings}</Badge>
                            </div>
                        )}
                        {data.pendingReports === 0 && data.pendingBookings === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">Tidak ada notifikasi</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payments */}
            <Card>
                <CardHeader>
                    <CardTitle>Pembayaran Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Penyewa</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Kamar</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Bulan</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Jumlah</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentPayments.length > 0 ? (
                                    data.recentPayments.map((payment: any) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-sm">{payment.tenants?.name || 'N/A'}</td>
                                            <td className="py-3 px-4 text-sm">{payment.tenants?.rooms?.room_number || 'N/A'}</td>
                                            <td className="py-3 px-4 text-sm">{payment.month}</td>
                                            <td className="py-3 px-4 text-sm font-medium">Rp {Number(payment.amount).toLocaleString('id-ID')}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <Badge
                                                    variant={
                                                        payment.status === 'verified'
                                                            ? 'default'
                                                            : payment.status === 'pending'
                                                                ? 'secondary'
                                                                : 'destructive'
                                                    }
                                                >
                                                    {payment.status === 'verified' ? 'Terverifikasi' : payment.status === 'pending' ? 'Pending' : 'Ditolak'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                                            Belum ada pembayaran
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
