import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPostHogServer } from '@/lib/posthog/server'
import { logger } from '@/lib/posthog/logger'
import { claimUserByEmail } from '@/lib/supabase/claim-user'
import { isSide, SIDE_COOKIE, SIDE_COOKIE_MAX_AGE, type Side } from '@/lib/side'

/**
 * Routes reachable without a session. `/design-system` is here because it is
 * the review surface for the brand work and has to be openable on Netlify
 * deploy previews, where Google sign-in fails with `origin_mismatch` — each
 * preview gets a fresh hostname and Google does not accept wildcard JS
 * origins (#81). It renders design tokens and sample components only: no user
 * data, no Supabase reads.
 */
const PUBLIC_PREFIXES = ['/login', '/auth', '/legal-lol', '/api/legal-lol', '/design-system']

function isPublicPath(pathname: string) {
    return pathname === '/' || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

// One-question page for members who finished onboarding before the
// Brothers/Sisters question existed (users.side is NULL).
const SIDE_ROUTE = '/onboarding/side'

type ServerClient = ReturnType<typeof createServerClient>

// The row the redirect logic needs. If users.side doesn't exist yet (this code
// deployed before migration 00024), fall back to onboarding_completed_at alone
// rather than erroring — the error path lets every request through, which would
// silently switch off the onboarding redirect for everyone.
async function readOnboardingRow(supabase: ServerClient, authId: string) {
    const withSide = await supabase
        .from('users')
        .select('onboarding_completed_at, side')
        .eq('auth_id', authId)
        .maybeSingle()
    if (withSide.error?.code !== '42703') return withSide // 42703 = undefined_column

    const withoutSide = await supabase
        .from('users')
        .select('onboarding_completed_at')
        .eq('auth_id', authId)
        .maybeSingle()
    return {
        data: withoutSide.data ? { ...withoutSide.data, side: SIDE_UNAVAILABLE } : null,
        error: withoutSide.error,
    }
}

// Marks "column not migrated yet" — distinct from NULL ("not chosen"), so the
// side prompt only fires once the column actually exists.
const SIDE_UNAVAILABLE = 'unavailable' as const

// Keep the theme cookie (read by the <head> script in layout.tsx) in step with
// users.side, or clear it when there's no signed-in user.
function syncSideCookie(request: NextRequest, response: NextResponse, side: Side | null) {
    const current = request.cookies.get(SIDE_COOKIE)?.value
    if (side && current !== side) {
        response.cookies.set(SIDE_COOKIE, side, {
            path: '/',
            maxAge: SIDE_COOKIE_MAX_AGE,
            sameSite: 'lax',
        })
    } else if (!side && current) {
        response.cookies.delete(SIDE_COOKIE)
    }
    return response
}

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
        // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
        // issues with users being randomly logged out.

        // getClaims() refreshes the session like getUser() but, with asymmetric
        // JWT signing keys, verifies the token locally instead of a round-trip to
        // Supabase Auth on every request (it falls back to getUser() otherwise).
        const { data: claimsData, error: getUserError } = await supabase.auth.getClaims()
        const claims = claimsData?.claims
        const user = claims ? { id: claims.sub, email: claims.email } : null

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
            if (!isPublicPath(request.nextUrl.pathname)) {
                // Redirect to login on auth errors
                const url = request.nextUrl.clone()
                url.pathname = '/login/'
                url.searchParams.set('error', 'session_expired')
                return NextResponse.redirect(url)
            }
            // Allow access to login/auth pages even without session
        }

        if (!user) syncSideCookie(request, supabaseResponse, null)

        if (!user && !isPublicPath(request.nextUrl.pathname)) {
            // no user, potentially respond by redirecting the user to the login page
            // (trailing slash matches `trailingSlash: true` — saves a 308 hop)
            const url = request.nextUrl.clone()
            url.pathname = '/login/'
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
            url.pathname = '/login/'
            url.searchParams.set('error', 'invalid_domain')
            return NextResponse.redirect(url)
        }

        // Onboarding Check - bidirectional redirect logic:
        // 1. Incomplete users on protected routes → redirect to onboarding
        // 2. Completed users on onboarding → redirect to home
        const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding')
        const isPublicRoute = isPublicPath(request.nextUrl.pathname)
        const isProtectedRoute = !isPublicRoute && !isOnboardingRoute
        // The onboarding lookup is a DB round-trip. Skip it for background link
        // prefetches (the real navigation re-runs middleware and redirects) and
        // for API routes, which authorize themselves and shouldn't be redirected
        // to a page anyway.
        const isPrefetch = request.headers.get('next-router-prefetch') === '1'
        const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

        if (user && !isPrefetch && !isApiRoute && (isProtectedRoute || isOnboardingRoute)) {
            const fetchOnboardingRow = () => readOnboardingRow(supabase, user.id)
            let { data: userData, error: queryError } = await fetchOnboardingRow()

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
                        const reread = await fetchOnboardingRow()
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

            const sideUnavailable = userData?.side === SIDE_UNAVAILABLE
            const side = isSide(userData?.side) ? userData.side : null
            const onboarded = Boolean(userData?.onboarding_completed_at)
            const isSideRoute = request.nextUrl.pathname.startsWith(SIDE_ROUTE)
            const redirectTo = (pathname: string) => {
                const url = request.nextUrl.clone()
                url.pathname = pathname
                return syncSideCookie(request, NextResponse.redirect(url), side)
            }

            if (isOnboardingRoute && onboarded) {
                // Onboarded but never picked a side → the one-question page is
                // the only onboarding route they may use.
                if (!side && !sideUnavailable && isSideRoute) {
                    return syncSideCookie(request, supabaseResponse, side)
                }
                // Completed user on onboarding → send to home
                return redirectTo('/home/')
            }

            if ((isProtectedRoute || isSideRoute) && !onboarded) {
                // Incomplete user on protected route → send to onboarding (the
                // full flow asks the side question itself)
                return redirectTo('/onboarding/')
            }

            if (isProtectedRoute && !side && !sideUnavailable) {
                // Onboarded before the Brothers/Sisters question existed.
                return redirectTo(`${SIDE_ROUTE}/`)
            }

            syncSideCookie(request, supabaseResponse, side)
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
