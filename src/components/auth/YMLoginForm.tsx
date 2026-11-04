import type { ReactNode } from 'react'

import { Logo } from '@/components/brand/logo'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface YMLoginFormProps {
  onSuccess: () => void | boolean | Promise<void | boolean>
  onError: (error: string) => void
  error: string | null
}

/** Shared presentation; the review fixture supplies an inert sign-in control. */
export function LoginScreen({ children, error }: { children: ReactNode; error?: string | null }) {
  return (
    <div className="ym-revised-screen relative isolate flex min-h-dvh flex-col overflow-hidden bg-background px-4 py-6 sm:items-center sm:justify-center sm:p-8">
      {/* Exact Figma exports; decorative contours never sit behind the copy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/login/shape-top.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -left-[110px] -top-20 -z-10 w-[220px] max-w-none sm:w-[360px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/login/shape-bottom.svg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-[120px] bottom-20 -z-10 w-[220px] max-w-none sm:-bottom-20 sm:-right-[220px] sm:w-[360px]" />
      <div className="flex w-full flex-1 flex-col justify-center sm:max-w-[480px] sm:flex-none sm:p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Logo variant="full" className="h-[16.316px] text-primary" />
            <h1 className="text-[22px] font-bold leading-tight tracking-brand sm:text-[28px]">Salaam. Welcome back.</h1>
          </div>
          <p className="text-base leading-tight text-muted-foreground">Sign in with your @youngmuslims.com Google account.</p>
          <div className="w-full max-w-[400px] space-y-3">
            {children}
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          </div>
        </div>
        <LoginTerms className="mt-6 hidden sm:block" />
      </div>
      <LoginTerms className="relative mt-4 sm:hidden" />
    </div>
  )
}

function LoginTerms({ className }: { className: string }) {
  return <p className={`text-center text-xs leading-tight text-muted-foreground ${className}`}>
    By continuing, you agree to our{' '}
    <a href="/legal-lol" className="underline underline-offset-2 focus-visible:outline-primary">Terms of Service</a>{' '}and{' '}
    <a href="/legal-lol" className="underline underline-offset-2 focus-visible:outline-primary">Privacy Policy</a>.
  </p>
}

export function YMLoginForm({ onSuccess, onError, error }: YMLoginFormProps) {
  return <LoginScreen error={error}><GoogleSignInButton onSuccess={onSuccess} onError={onError} /></LoginScreen>
}
