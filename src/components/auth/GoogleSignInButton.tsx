'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from 'react'

const supabase = createClient()

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
        width?: number
      }
    ) => void
    cancel: () => void
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
  onSuccess?: () => void | Promise<void>
  onError?: (error: string) => void
}

export default function GoogleSignInButton({
  onSuccess,
  onError
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  // Ref to the container Google renders its (fixed-width) button into.
  const containerRef = useRef<HTMLDivElement>(null)
  // Last pixel width we rendered at — lets the ResizeObserver skip no-op
  // re-renders and avoid re-initializing GIS on every sub-pixel reflow.
  const lastRenderedWidth = useRef(0)

  // Google's max button width is 400px (per GsiButtonConfiguration). We render
  // the button at the container's exact width so it fills the slot and there's
  // no leftover space for the fixed-width iframe to sit off-center in.
  const GSI_MAX_WIDTH = 400

  // Memoized sign-in handler - stable reference across renders
  const handleSignInWithGoogle = useCallback(async (response: GoogleCredentialResponse) => {
    setIsLoading(true)
    try {
      // Decode the JWT to check the email domain before sending to Supabase
      const payload = JSON.parse(atob(response.credential.split('.')[1]))

      // Domain validation is enforced by middleware
      // This client-side check provides immediate feedback
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

      if (process.env.NODE_ENV === 'development') {
        console.log('Successfully logged in with Google:', data.user?.email)
      }
      // Keep isLoading = true through the redirect: onSuccess navigates away
      // (and unmounts us), so clearing it here would flash a bare, idle login
      // page during the post-auth round-trips. We only reset loading on error.
      await onSuccess?.()
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google sign in error:', error)
      }
      const rawMessage = error instanceof Error ? error.message : String(error)
      try {
        import('posthog-js').then(({ default: posthog }) => {
          posthog.capture('user_login_failed', { error_message: rawMessage })
        })
      } catch { /* observability */ }
      setIsLoading(false)
      onError?.(rawMessage)
    }
  }, [onSuccess, onError])

  // Memoized button renderer - stable reference
  // Note: Uses window.handleSignInWithGoogle which is set in useEffect
  const renderGoogleButton = useCallback(() => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      return
    }

    const buttonElement = containerRef.current
    if (!buttonElement) {
      return
    }

    // Measure the container. Google bakes a fixed pixel width into the button
    // at render time and never resizes it, so we must pass an explicit width
    // that matches the slot. If the element hasn't been laid out yet (width 0),
    // bail — the ResizeObserver will call us back once it has a real width,
    // which is what eliminates the "rendered before layout settled" race.
    const measured = Math.floor(buttonElement.getBoundingClientRect().width)
    if (measured === 0) {
      return
    }
    const width = Math.min(measured, GSI_MAX_WIDTH)
    lastRenderedWidth.current = width

    // Clear any existing button content before re-rendering
    buttonElement.innerHTML = ''

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: window.handleSignInWithGoogle,
      hosted_domain: ALLOWED_DOMAIN,
    })

    // Disable automatic One Tap prompt
    // This ensures only our custom button is shown, not Google's floating One Tap UI
    window.google.accounts.id.cancel()

    // Render the sign-in button at the measured width so the iframe fills the
    // slot exactly — no descendant-selector CSS hacks needed to center it.
    window.google.accounts.id.renderButton(buttonElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
    })
  }, [])

  // Effect to render button whenever component mounts or Google SDK loads
  useEffect(() => {
    // Make the callback function globally available
    window.handleSignInWithGoogle = handleSignInWithGoogle

    // If Google is already loaded, render immediately
    if (window.google) {
      renderGoogleButton()
    }

    // Re-render when the container's width changes. This handles three cases:
    // 1) the initial layout settling after mount (measured width goes 0 → real),
    // 2) viewport resize / device rotation, and
    // 3) the login card's entry animation completing.
    // We only re-render when the integer width actually changes, so GIS isn't
    // re-initialized on every sub-pixel reflow.
    const container = containerRef.current
    let observer: ResizeObserver | undefined
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (!window.google) return
        const width = Math.min(
          Math.floor(container.getBoundingClientRect().width),
          GSI_MAX_WIDTH
        )
        if (width > 0 && width !== lastRenderedWidth.current) {
          renderGoogleButton()
        }
      })
      observer.observe(container)
    }

    // Cleanup: remove global reference when component unmounts
    return () => {
      observer?.disconnect()
      // Cast to any to allow deletion of global property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).handleSignInWithGoogle
    }
  }, [handleSignInWithGoogle, renderGoogleButton])

  // Function to initialize when script first loads
  const initializeGoogleSignIn = useCallback(() => {
    // Make the callback function globally available
    window.handleSignInWithGoogle = handleSignInWithGoogle
    // Render the button
    renderGoogleButton()
  }, [handleSignInWithGoogle, renderGoogleButton])

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
      />

      <div className="w-full">
        {/* Google renders a fixed-width button here. We size it to this
            container's width (see renderGoogleButton), so a simple centered
            flex is enough — no descendant-selector overrides to fight GIS's
            internal DOM, which is what made centering flaky before. */}
        <div
          ref={containerRef}
          id="google-signin-button"
          className={`flex w-full justify-center ${
            isLoading ? 'opacity-50 pointer-events-none' : ''
          }`}
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