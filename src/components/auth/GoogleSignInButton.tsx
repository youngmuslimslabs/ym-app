'use client'

import Script from 'next/script'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const ALLOWED_DOMAIN = 'youngmuslims.com'

/* --- Minimal types for Google Identity Services we use --- */
type CredentialResponse = {
  credential: string
  select_by?: string
  clientId?: string
}

type InitializeOptions = {
  client_id: string
  callback: (response: CredentialResponse) => void
  hosted_domain?: string
}

type RenderButtonOptions = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'continue_with' | 'signin_with' | 'signup_with'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: InitializeOptions) => void
          renderButton: (el: HTMLElement | null, opts?: RenderButtonOptions) => void
        }
      }
    }
    handleSignInWithGoogle: (response: CredentialResponse) => void
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
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSignInWithGoogle = async (response: CredentialResponse) => {
    setIsLoading(true)
    try {
      // Decode the JWT to check the email domain (UX only; enforce on server)
      const payloadPart = response.credential.split('.')[1] ?? ''
      const payloadJson = atob(payloadPart)
      const payload = JSON.parse(payloadJson) as { email?: string }

      if (!payload.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        const msg = `Access restricted to @${ALLOWED_DOMAIN} accounts only`
        onError?.(msg)
        return
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      })

      if (error) throw error

      // success
      // eslint-disable-next-line no-console
      console.log('Successfully logged in with Google:', data.user?.email)
      onSuccess?.()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      // eslint-disable-next-line no-console
      console.error('Google sign in error:', err)
      onError?.(message)
    } finally {
      setIsLoading(false)
    }
  }

  const initializeGoogleSignIn = (): void => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!window.google || !clientId) {
      // eslint-disable-next-line no-console
      console.error('Google client not loaded or Client ID not configured')
      return
    }

    // Expose the callback (Google script calls it)
    window.handleSignInWithGoogle = handleSignInWithGoogle

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: window.handleSignInWithGoogle,
      hosted_domain: ALLOWED_DOMAIN
    })

    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left'
      }
    )
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />
      <div className="w-full">
        <div
          id="google-signin-button"
          className={`w-full [&>div]:w-full [&>div]:!flex [&>div]:!justify-center [&>div>div]:!w-full ${
            isLoading ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ display: 'flex', justifyContent: 'center' }}
        />
        {isLoading && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-sm text-muted-foreground">Signing in...</span>
          </div>
        )}
      </div>
    </>
  )
  
}
