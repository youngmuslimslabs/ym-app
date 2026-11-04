import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder images, the PWA manifest and service worker
     * (matcher regexes can't take an `i` flag, hence the uppercase variants).
     * The spending-policy PDF under /public stays behind the login check.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|SVG|PNG|JPG|JPEG|GIF|WEBP)$).*)',
  ],
}