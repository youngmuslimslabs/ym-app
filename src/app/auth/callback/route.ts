import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/home'

    if (code) {
        const supabase = await createClient()
        const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && authData.user) {
            // Check if user has completed onboarding
            const { data: userData } = await supabase
                .from('users')
                .select('onboarding_completed_at')
                .eq('auth_id', authData.user.id)
                .single()

            // Determine redirect path based on onboarding status
            let redirectPath = next
            if (!userData?.onboarding_completed_at) {
                // User hasn't completed onboarding, send to step 1
                redirectPath = '/onboarding?step=1'
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            }
        }
    }

    // return the user to login with error message
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
