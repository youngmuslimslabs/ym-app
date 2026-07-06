import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPostHogServer } from '@/lib/posthog/server'
import { logger } from '@/lib/posthog/logger'
import { claimUserByEmail } from '@/lib/supabase/claim-user'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    // PROTOTYPE-ONLY: remove before merge — public, auth-free preview of the
    // profile-completion gating pattern at /gating-preview.
    if (request.nextUrl.pathname.startsWith('/gating-preview')) {
        return supabaseResponse
    }

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
            // Only capture unexpected errors (not missing sessions, which are normal when logged out)
            if (getUserError.status !== 400) {
                try {
                    getPostHogServer().capture({
                        distinctId: 'middleware',
                        event: 'middleware_auth_error',
                        properties: {
                            error_status: getUserError.status,
                            error_message: getUserError.message,
                            path: request.nextUrl.pathname,
                        },
                    })
                    logger.error('middleware_auth_error', {
                        attrs: {
                            error_status: getUserError.status,
                            error_message: getUserError.message,
                            path: request.nextUrl.pathname,
                        },
                    })
                } catch { /* observability must not affect request path */ }
            }

            // Don't redirect if already on login, auth, or onboarding pages (prevents redirect loop)
            if (
                !request.nextUrl.pathname.startsWith('/login') &&
                !request.nextUrl.pathname.startsWith('/auth') &&
                !request.nextUrl.pathname.startsWith('/legal-lol') &&
                !request.nextUrl.pathname.startsWith('/api/legal-lol') &&
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
            !request.nextUrl.pathname.startsWith('/legal-lol') &&
            !request.nextUrl.pathname.startsWith('/api/legal-lol') &&
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
                // Capture sign out error but continue with redirect
                try {
                    const errMsg = signOutError instanceof Error ? signOutError.message : String(signOutError)
                    getPostHogServer().capture({
                        distinctId: user.id,
                        event: 'middleware_domain_signout_failed',
                        properties: { error_message: errMsg, path: request.nextUrl.pathname },
                    })
                    logger.error('middleware_domain_signout_failed', {
                        distinctId: user.id,
                        attrs: { error_message: errMsg, path: request.nextUrl.pathname },
                    })
                } catch { /* observability must not affect request path */ }
            }

            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', 'invalid_domain')
            return NextResponse.redirect(url)
        }

        // Onboarding Check - bidirectional redirect logic:
        // 1. Incomplete users on protected routes → redirect to onboarding
        // 2. Completed users on onboarding → redirect to home
        const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
        const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
            request.nextUrl.pathname.startsWith('/auth') ||
            request.nextUrl.pathname.startsWith('/legal-lol') ||
            request.nextUrl.pathname.startsWith('/api/legal-lol') ||
            request.nextUrl.pathname === '/'
        const isProtectedRoute = !isPublicRoute && !isOnboardingRoute

        if (user && (isProtectedRoute || isOnboardingRoute)) {
            let { data: userData, error: queryError } = await supabase
                .from('users')
                .select('onboarding_completed_at')
                .eq('auth_id', user.id)
                .maybeSingle()

            // Self-heal: an authenticated (domain-validated) user with no linked
            // row means their pre-provisioned users row was never claimed by the
            // on_auth_user_created trigger (it only fires on the first-ever
            // auth.users insert). Link it by email now — service-role, because
            // RLS forbids the user from setting auth_id on a NULL-auth_id row —
            // then re-read so redirect logic uses the real onboarding status.
            // Scope: this only claims rows where auth_id IS NULL. A row already
            // claimed by a stale/mismatched auth_id is intentionally left alone
            // (won't match), so no repeated writes fix it — that's a separate case.
            if (!queryError && !userData && user.email) {
                try {
                    const { claimed } = await claimUserByEmail(user.id, user.email)
                    if (claimed) {
                        const reread = await supabase
                            .from('users')
                            .select('onboarding_completed_at')
                            .eq('auth_id', user.id)
                            .maybeSingle()
                        userData = reread.data
                        queryError = reread.error
                    }
                } catch { /* self-heal must never break the request path */ }
            }

            // On DB error, let the request through rather than incorrectly redirecting
            if (queryError && queryError.code !== 'PGRST116') {
                try {
                    getPostHogServer().capture({
                        distinctId: user.id,
                        event: 'middleware_onboarding_query_error',
                        properties: {
                            error_code: queryError.code,
                            error_message: queryError.message,
                            path: request.nextUrl.pathname,
                        },
                    })
                    logger.error('middleware_onboarding_query_error', {
                        distinctId: user.id,
                        attrs: {
                            error_code: queryError.code,
                            error_message: queryError.message,
                            path: request.nextUrl.pathname,
                        },
                    })
                } catch { /* observability must not affect request path */ }
                return supabaseResponse
            }

            if (isOnboardingRoute && userData?.onboarding_completed_at) {
                // Completed user on onboarding → send to home
                const url = request.nextUrl.clone()
                url.pathname = '/home'
                return NextResponse.redirect(url)
            }

            if (isProtectedRoute && !userData?.onboarding_completed_at) {
                // Incomplete user on protected route → send to onboarding
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                url.searchParams.set('step', '1')
                return NextResponse.redirect(url)
            }
        }
    } catch (error) {
        // Catch any unexpected errors in middleware
        try {
            const errMsg = error instanceof Error ? error.message : String(error)
            getPostHogServer().capture({
                distinctId: 'middleware',
                event: 'middleware_unexpected_error',
                properties: { error_message: errMsg, path: request.nextUrl.pathname },
            })
            logger.error('middleware_unexpected_error', {
                attrs: { error_message: errMsg, path: request.nextUrl.pathname },
            })
        } catch { /* observability must not affect request path */ }

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
