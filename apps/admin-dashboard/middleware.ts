import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for API routes and Next.js internals
  if (path.startsWith('/api') || path.startsWith('/_next') || path === '/favicon.ico') {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/confirm-email',
    '/debug-auth',
    '/test-auth',
  ];
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  const isDashboardRoute = path.startsWith('/dashboard');

  // Check for auth token in cookies
  const authToken = request.cookies.get('authToken')?.value;
  const hasToken = !!authToken;

  // Enhanced logging for debugging
  if (path.includes('/policies') && path.includes('/edit')) {
    console.log(`[Middleware] Policy Edit Navigation:`, {
      path,
      hasToken,
      tokenPrefix: authToken?.substring(0, 20),
      allCookies: request.cookies.getAll().map(c => c.name),
    });
  } else {
    console.log(`[Middleware] ${path} - Auth: ${hasToken ? 'YES' : 'NO'}`);
  }

  // Protect dashboard routes
  if (isDashboardRoute && !hasToken) {
    console.log(`[Middleware] No token for dashboard route: ${path}`);
    // Check if token exists in Authorization header (for API calls)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('[Middleware] Found token in Authorization header, allowing request');
      return NextResponse.next();
    }
    
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from public routes
  if (isPublicRoute && hasToken && path !== '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
