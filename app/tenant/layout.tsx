import { DoorOpen, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/tenant/dashboard" className="flex items-center space-x-3">
                        <DoorOpen className="h-8 w-8" />
                        <div>
                            <h1 className="text-xl font-bold">Home72</h1>
                            <p className="text-xs text-blue-100">Portal Penyewa</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => {
                            localStorage.removeItem('home72_tenant')
                            window.location.href = '/tenant/login'
                        }}
                        className="flex items-center space-x-2 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Keluar</span>
                    </button>
                </div>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-gray-900 text-white py-6 text-center">
                <p className="font-semibold">Home72 Kosan</p>
                <p className="text-gray-400 text-sm mt-1">
                    © {new Date().getFullYear()} All rights reserved
                </p>
            </footer>
        </div>
    )
}
