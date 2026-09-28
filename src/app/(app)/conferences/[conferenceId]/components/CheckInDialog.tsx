'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHECK_IN_CODE_MAX_LENGTH, formatCheckInCode } from '@/lib/check-in-code'

// The RPC's error when a member has used up their wrong-code attempts (#73).
const TOO_MANY_ATTEMPTS = 'Too many attempts'

interface Props {
  alreadyCheckedIn: boolean
  pending: boolean
  // Parent-supplied error from the last RPC attempt. When non-null, the form
  // renders destructive chrome and the input remains so the user can edit.
  error: string | null
  // The session has ended but check-in is still open in its grace tail. Shifts
  // the copy to convey urgency ("check in now, before it closes").
  inGracePeriod?: boolean
  // Epoch ms until which the server refuses attempts after too many wrong
  // codes. While it's in the future the form is disabled.
  lockedUntil?: number | null
  onSubmit: (code: string) => Promise<void>
}

export function CheckInDialog({
  alreadyCheckedIn,
  pending,
  error,
  inGracePeriod = false,
  lockedUntil = null,
  onSubmit,
}: Props) {
  const [code, setCode] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const tooMany = error === TOO_MANY_ATTEMPTS
  const locked = tooMany && lockedUntil !== null && now < lockedUntil
  const wrongCode = error !== null && !tooMany
  const minutesLeft = locked ? Math.max(1, Math.ceil(((lockedUntil ?? now) - now) / 60_000)) : 0

  // Tick while locked so the countdown copy stays honest and the form unlocks
  // on its own.
  useEffect(() => {
    if (!tooMany || lockedUntil === null) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 15_000)
    const unlock = setTimeout(() => setNow(Date.now()), Math.max(0, lockedUntil - Date.now()))
    return () => {
      clearInterval(id)
      clearTimeout(unlock)
    }
  }, [tooMany, lockedUntil])

  const showError = locked || wrongCode
  const submit = () => {
    const trimmed = code.trim()
    if (trimmed && !pending && !locked) void onSubmit(trimmed)
  }

  if (alreadyCheckedIn) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit mb-3">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-base font-semibold tracking-tight mb-1">
          You&apos;re checked in
        </h3>
        <p className="text-sm text-muted-foreground">
          Feedback opens once the session ends.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        showError
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'rounded-full p-2 shrink-0',
            showError ? 'bg-destructive/10' : 'bg-primary/10'
          )}
        >
          {showError ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : inGracePeriod ? (
            <Clock className="w-4 h-4 text-primary" />
          ) : (
            <Lock className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {locked
              ? 'Too many tries'
              : wrongCode
              ? "That code didn't match"
              : inGracePeriod
                ? 'Session ended — check in now'
                : 'Check in to this session'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locked
              ? `Check-in is paused for this session. Try again in ${minutesLeft} min.`
              : wrongCode
              ? 'Double-check the code with the speaker.'
              : inGracePeriod
                ? 'Check in now before the window closes.'
                : 'Enter the check-in code from the speaker.'}
          </p>
        </div>
      </div>
      <Input
        value={code}
        onChange={(e) => setCode(formatCheckInCode(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        disabled={pending || locked}
        maxLength={CHECK_IN_CODE_MAX_LENGTH}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Check-in code"
        placeholder="Enter code"
        className={cn(
          'mb-3 font-mono tracking-widest text-center',
          showError && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      <Button
        className="w-full"
        disabled={!code.trim() || pending || locked}
        onClick={submit}
      >
        {pending ? 'Checking in…' : locked ? `Try again in ${minutesLeft} min` : error ? 'Try again' : 'Check in'}
      </Button>
    </div>
  )
}
