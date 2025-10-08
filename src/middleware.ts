import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that should be accessible without authentication
// TODO: CRITICAL - Implement server-side auth check before production deploy
// Currently NO route protection exists - users can access any route by direct URL
// Need to:
// 1. Create Supabase middleware client
// 2. Check session on each request
// 3. Redirect unauthenticated users from protected routes
// const publicRoutes = ['/login', '/home', '/', '/api/auth']

export function middleware(_request: NextRequest) {
  // WARNING: For now, allow all routes since auth is handled client-side only
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