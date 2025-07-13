import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/confirm-email', '/debug-auth', '/test-auth'];

// Routes that should be completely excluded from auth checks
const excludedRoutes = ['/_next', '/api', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip middleware for excluded routes
  if (excludedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  const isDashboardRoute = path.startsWith('/dashboard');

  // Check for auth token in cookies
  const authTokenCookie = request.cookies.get('authToken');
  const cookieToken = authTokenCookie?.value;
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const hasToken = !!(cookieToken || headerToken);
  
  // Enhanced debug logging
  console.log('🔐 Middleware Auth Check:', {
    path,
    isPublicRoute,
    isDashboardRoute,
    hasToken,
    cookieDetails: {
      exists: !!authTokenCookie,
      hasValue: !!cookieToken,
      valueLength: cookieToken?.length || 0,
      first20Chars: cookieToken ? cookieToken.substring(0, 20) + '...' : null
    },
    allCookieNames: request.cookies.getAll().map(c => c.name),
    timestamp: new Date().toISOString()
  });

  // Protect dashboard routes
  if (isDashboardRoute && !hasToken) {
    console.log('🚫 Redirecting to login - no token found for dashboard route');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from public routes (except debug-auth)
  if (isPublicRoute && hasToken && path !== '/' && path !== '/debug-auth') {
    console.log('✅ Redirecting to dashboard - user already authenticated');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
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
};
