'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Home, LayoutDashboard, DoorOpen, Users, CreditCard, MessageSquare, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Kamar', href: '/rooms', icon: DoorOpen },
    { name: 'Penyewa', href: '/tenants', icon: Users },
    { name: 'Pembayaran', href: '/payments', icon: CreditCard },
    { name: 'Pengaduan', href: '/reports', icon: MessageSquare },
]

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <Home className="h-8 w-8" />
                            <span className="font-bold text-xl">Home72</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname.startsWith(item.href)
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-800 text-white'
                                            : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            )
                        })}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-blue-100 hover:bg-blue-500 hover:text-white"
                        >
                            <LogOut className="h-4 w-4 mr-1" />
                            Keluar
                        </Button>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center">
                        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-white">
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        {isOpen ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        )}
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {navigation.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <DropdownMenuItem key={item.name} asChild>
                                            <Link href={item.href} className="flex items-center space-x-2">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )
                                })}
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </nav>
    )
}
