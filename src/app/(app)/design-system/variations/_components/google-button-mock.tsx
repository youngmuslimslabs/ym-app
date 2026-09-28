// Static stand-in for Google's sign-in button, so the variation pages don't
// load Google Identity Services or start a real sign-in. The G mark keeps
// Google's own colours, as the real button does.
export function GoogleButtonMock() {
  return (
    <button
      type="button"
      className="flex h-11 w-full items-center gap-3 rounded-md border border-[#dadce0] bg-white px-3 text-sm font-medium text-[#3c4043] transition-colors hover:bg-[#f8f9fa]"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5 shrink-0">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span className="flex-1 text-center">Continue with Google</span>
    </button>
  )
}

/** The sign-in block every login variation shares: title, hint, button, terms. */
export function SignInPanel({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold leading-tight">Welcome back</h2>
          <p className="text-muted-foreground">Sign in with your youngmuslims.com Google account.</p>
        </div>
        <GoogleButtonMock />
        <p className="text-pretty text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <span className="underline underline-offset-4">Terms of Service</span> and{' '}
          <span className="underline underline-offset-4">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}
