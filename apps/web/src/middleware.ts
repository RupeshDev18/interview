import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Presence of refresh token cookie is our auth signal in middleware
  // (access token is in memory, not accessible here)
  const hasRefreshToken = request.cookies.has('refresh_token');

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Authenticated user trying to visit login/register → redirect to dashboard
  if (hasRefreshToken && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user trying to visit protected route → redirect to login
  if (!hasRefreshToken && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
