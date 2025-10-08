'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { YMLoginForm } from '@/components/auth/YMLoginForm'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/home')
    }
  }, [user, loading, router])

  const handleGoogleSuccess = () => {
    router.push('/home')
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <YMLoginForm
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        error={error}
      />
    </div>
  )
}