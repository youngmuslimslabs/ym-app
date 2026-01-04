import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        )
                        supabaseResponse = NextResponse.next({
                            request,
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // IMPORTANT: Avoid writing any logic between createServerClient and
        // supabase.auth.getUser(). A simple mistake could make it very hard to debug
        // issues with users being randomly logged out.

        const {
            data: { user },
            error: getUserError,
        } = await supabase.auth.getUser()

        // Handle auth errors (network failures, invalid tokens, etc.)
        if (getUserError) {
            // Only log unexpected errors (not missing sessions, which are normal when logged out)
            if (process.env.NODE_ENV === 'development' && getUserError.status !== 400) {
                console.error('Middleware auth error:', getUserError)
            }

            // Don't redirect if already on login, auth, or onboarding pages (prevents redirect loop)
            if (
                !request.nextUrl.pathname.startsWith('/login') &&
                !request.nextUrl.pathname.startsWith('/auth') &&
                !request.nextUrl.pathname.startsWith('/onboarding') &&
                request.nextUrl.pathname !== '/'
            ) {
                // Redirect to login on auth errors
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                url.searchParams.set('error', 'session_expired')
                return NextResponse.redirect(url)
            }
            // Allow access to login/auth pages even without session
        }

        if (
            !user &&
            !request.nextUrl.pathname.startsWith('/login') &&
            !request.nextUrl.pathname.startsWith('/auth') &&
            !request.nextUrl.pathname.startsWith('/onboarding') &&
            request.nextUrl.pathname !== '/'
        ) {
            // no user, potentially respond by redirecting the user to the login page
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Domain Validation
        const ALLOWED_DOMAIN = 'youngmuslims.com'
        if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
            // Sign out the user if they are from the wrong domain
            try {
                await supabase.auth.signOut()
            } catch (signOutError) {
                // Log sign out error but continue with redirect
                if (process.env.NODE_ENV === 'development') {
                    console.error('Sign out error during domain validation:', signOutError)
                }
            }

            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'invalid_domain')
            return NextResponse.redirect(url)
        }
    } catch (error) {
        // Catch any unexpected errors in middleware
        if (process.env.NODE_ENV === 'development') {
            console.error('Unexpected middleware error:', error)
        }

        // Allow request to continue if middleware fails
        // This prevents total app failure on middleware errors
        return supabaseResponse
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    return supabaseResponse
}
