import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should be accessible without authentication
// TODO: Implement server-side auth check in production
// const publicRoutes = ['/login', '/home', '/', '/api/auth']

export function middleware(_request: NextRequest) {
  // For now, allow all routes since auth is handled client-side
  // In production, check for session cookie and enforce publicRoutes
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}