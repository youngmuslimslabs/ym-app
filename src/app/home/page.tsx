'use client'

import { useAuth } from '@/contexts/AuthContext'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function HomePage() {
  const { user, signOut, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGoogleSuccess = () => {
    // On success, just reload the page to show logged-in state
    router.refresh()
  }

  const handleGoogleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (user) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Welcome to YM App</CardTitle>
          <p className="text-center text-muted-foreground text-sm">
            Sign in to continue to your account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              <span className="font-semibold">Access Information:</span> Sign in is restricted to @youngmuslims.com accounts only
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}