'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  // Protected content - only shown to authenticated users
  if (!user) {
    // Show loading while redirect happens
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Redirecting...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Welcome!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Email:</span> {user.email}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">User ID:</span> {user.id}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Created:</span>{' '}
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <Button
            onClick={() => signOut()}
            variant="destructive"
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}