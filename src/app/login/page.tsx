'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { YMLoginForm } from '@/components/auth/YMLoginForm'
import { PageLoader } from '@/components/ui/page-loader'
import { createClient } from '@/lib/supabase/client'
import { checkOnboardingComplete } from '@/lib/supabase/onboarding'

const supabase = createClient()
import { toUserMessage } from '@/lib/errors/userMessage'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showLoader, setShowLoader] = useState(false)
  const router = useRouter()
  const isRedirecting = useRef(false)

  // Redirect if already logged in — check onboarding status first
  useEffect(() => {
    if (user && !loading && !isRedirecting.current) {
      isRedirecting.current = true
      checkOnboardingComplete(user.id).then(isComplete => {
        router.push(isComplete ? '/home' : '/onboarding?step=1')
      })
    }
  }, [user, loading, router])

  // Only show loader if auth check takes more than 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoader(true)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [loading])

  const handleGoogleSuccess = async () => {
    if (isRedirecting.current) return
    isRedirecting.current = true
    // We just signed in, so the session is already in local storage. Use
    // getSession() (local read) instead of getUser() (a network round-trip
    // that re-validates the token against the Auth server) — the extra hop
    // was dead time between the Google prompt closing and navigating.
    const { data: { session } } = await supabase.auth.getSession()
    const authUser = session?.user
    if (!authUser) { isRedirecting.current = false; return }
    const isComplete = await checkOnboardingComplete(authUser.id)
    router.push(isComplete ? '/home' : '/onboarding?step=1')
  }

  const handleGoogleError = (rawMessage: string) => {
    console.error('Login error:', rawMessage)
    setError(toUserMessage(rawMessage, { action: 'sign in with Google' }))
  }

  if (loading && showLoader) {
    return <PageLoader />
  }

  // Don't render login form until we know auth state
  if (loading) {
    return null
  }

  return (
    <div className="login-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-sm">
        <YMLoginForm
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          error={error}
        />
      </div>
    </div>
  )
}