import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/forgot-password')
  
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')
  
  // For now, we'll just check if there's a token in cookies
  // In production, you would validate this token
  const token = request.cookies.get('auth-token')
  
  if (isDashboardRoute && !token) {
    // Redirect to login if trying to access dashboard without auth
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (isAuthRoute && token) {
    // Redirect to dashboard if already authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}