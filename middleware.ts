import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // ========================================
    // SUBDOMAIN-BASED REDIRECTS
    // ========================================
    const hostname = request.headers.get('host') || ''
    const pathname = request.nextUrl.pathname

    // Admin subdomain: jerry.adminkos.otomasikan.com → /auth/login
    if (hostname.includes('jerry.adminkos.otomasikan.com') && pathname === '/') {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Tenant subdomain: userkos.otomasikan.com → /tenant/login
    if (hostname.includes('userkos.otomasikan.com') && pathname === '/') {
        return NextResponse.redirect(new URL('/tenant/login', request.url))
    }

    // Booking subdomain: bookingkos.otomasikan.com → /booking
    if (hostname.includes('bookingkos.otomasikan.com') && pathname === '/') {
        return NextResponse.redirect(new URL('/booking', request.url))
    }
    // ========================================

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const isAuthPage = pathname.startsWith('/auth')
    const isPublicBooking = pathname.startsWith('/booking')
    const isTenantLogin = pathname === '/tenant/login'
    const isTenantRoute = pathname.startsWith('/tenant')
    const isApiRoute = pathname.startsWith('/api')
    const isPublicApi = pathname.startsWith('/api/booking') || pathname.startsWith('/api/telegram')

    // Allow public access to tenant login, booking, and specific APIs
    if (isPublicBooking || isTenantLogin || (isApiRoute && isPublicApi)) {
        return response
    }

    // Allow auth pages
    if (isAuthPage) {
        return response
    }

    const user = session?.user

    // Protect admin routes (require Supabase auth)
    if (!isTenantRoute) {
        if (!user && !isAuthPage) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
    }

    // Protect tenant routes (check localStorage in client, allow API calls)
    if (isTenantRoute && !isTenantLogin && !isApiRoute) {
        // Tenant auth is client-side via localStorage
        // Middleware can't check localStorage, so allow through
        // Protection happens in each page component
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/rooms/:path*',
        '/tenants/:path*',
        '/payments/:path*',
        '/reports/:path*',
        '/auth/:path*',
        '/booking/:path*',
    ],
}
