'use client'

import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const ALLOWED_DOMAIN = 'youngmuslims.com'

// Proper TypeScript interfaces for Google Identity Services
interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

interface GoogleAccounts {
  id: {
    initialize: (config: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
      hosted_domain?: string
    }) => void
    renderButton: (
      parent: HTMLElement | null,
      options: {
        type?: string
        theme?: string
        size?: string
        text?: string
        shape?: string
        logo_alignment?: string
      }
    ) => void
  }
}

declare global {
  interface Window {
    google: {
      accounts: GoogleAccounts
    }
    handleSignInWithGoogle: (response: GoogleCredentialResponse) => void
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

  const handleSignInWithGoogle = async (response: GoogleCredentialResponse) => {
    setIsLoading(true)
    try {
      // Decode the JWT to check the email domain before sending to Supabase
      const payload = JSON.parse(atob(response.credential.split('.')[1]))

      // TODO: Move domain validation to server-side (API route or Supabase Auth Hook)
      // Client-side validation can be bypassed - this is only for UX
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
    } catch (error: unknown) {
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

    // Make the callback function globally available
    window.handleSignInWithGoogle = handleSignInWithGoogle

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: window.handleSignInWithGoogle,
      hosted_domain: ALLOWED_DOMAIN,
    })

    // Render the sign-in button with custom styling to match shadcn
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      }
    )

    // Initialization complete
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />

      <div className="w-full">
        {/* shadcn-styled wrapper around Google's button */}
        <div
          id="google-signin-button"
          className={`
            w-full
            [&>div]:w-full
            [&>div]:!flex
            [&>div]:!justify-center
            [&>div>div]:!w-full
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          `}
          style={{
            // Override Google's default styles to match shadcn
            display: 'flex',
            justifyContent: 'center',
          }}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-muted-foreground">
              Signing in...
            </span>
          </div>
        )}
      </div>
    </>
  )
}