'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in → redirect to home
        router.push('/home')
      } else {
        // User is not logged in → redirect to login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <span className="text-muted-foreground">Loading...</span>
    </div>
  )
}
