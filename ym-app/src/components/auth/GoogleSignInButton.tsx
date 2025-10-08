'use client'

import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const ALLOWED_DOMAIN = 'youngmuslims.com'

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: unknown) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function GoogleSignInButton({
  onSuccess,
  onError
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleCredentialResponse = async (response: { credential: string }) => {
    setIsLoading(true)
    try {
      // Decode the JWT to check the email domain before sending to Supabase
      const payload = JSON.parse(atob(response.credential.split('.')[1]))

      // Verify email domain
      if (!payload.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        const errorMsg = `Access restricted to @${ALLOWED_DOMAIN} accounts only`
        onError?.(errorMsg)
        setIsLoading(false)
        return
      }

      // Sign in with Supabase using the ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) throw error

      console.log('Successfully logged in with Google:', data.user?.email)
      onSuccess?.()
    } catch (error) {
      console.error('Google sign in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const initializeGoogleSignIn = () => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('Google client not loaded or Client ID not configured')
      return
    }

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      use_fedcm_for_prompt: true,
      hosted_domain: ALLOWED_DOMAIN,
    })

    setIsInitialized(true)
  }

  const handleClick = () => {
    if (!isInitialized || !window.google) {
      onError?.('Google Sign-In is not ready yet. Please wait a moment.')
      return
    }

    // Programmatically trigger Google One-Tap or popup
    window.google.accounts.id.prompt()
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />

      <Button
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={isLoading || !isInitialized}
      >
        {isLoading ? (
          'Signing in...'
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>
    </>
  )
}