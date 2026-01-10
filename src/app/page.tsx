'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PageLoader } from '@/components/ui/page-loader'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showLoader, setShowLoader] = useState(false)

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

  // Only show loader if auth check takes more than 150ms
  // This prevents flash of loader on fast connections
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoader(true)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [loading])

  // Show loading state only if auth is actually taking time
  if (!showLoader) {
    return null
  }

  return <PageLoader />
}
