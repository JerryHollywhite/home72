import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 bg-gray-50">
                {children}
            </main>
            <Footer />
        </div>
    )
}
