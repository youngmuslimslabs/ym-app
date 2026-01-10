'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { YMLoginForm } from '@/components/auth/YMLoginForm'
import { PageLoader } from '@/components/ui/page-loader'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showLoader, setShowLoader] = useState(false)
  const router = useRouter()

  // Redirect if already logged in
  // TODO: Make this dynamic - check if user has completed onboarding
  // If onboarding_completed: redirect to /home
  // If not completed: redirect to /onboarding?step=1
  useEffect(() => {
    if (user && !loading) {
      router.push('/onboarding?step=1')
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

  const handleGoogleSuccess = () => {
    // TODO: Make this dynamic based on onboarding completion status
    router.push('/onboarding?step=1')
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (loading && showLoader) {
    return <PageLoader />
  }

  // Don't render login form until we know auth state
  if (loading) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <YMLoginForm
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          error={error}
        />


      </div>
    </div>
  )
}