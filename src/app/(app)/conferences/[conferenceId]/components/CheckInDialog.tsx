'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  alreadyCheckedIn: boolean
  pending: boolean
  // Parent-supplied error from the last RPC attempt. When non-null, the form
  // renders destructive chrome and the input remains so the user can edit.
  error: string | null
  // The session has ended but check-in is still open in its grace tail. Shifts
  // the copy to convey urgency ("check in now, before it closes").
  inGracePeriod?: boolean
  onSubmit: (code: string) => Promise<void>
}

export function CheckInDialog({
  alreadyCheckedIn,
  pending,
  error,
  inGracePeriod = false,
  onSubmit,
}: Props) {
  const [code, setCode] = useState('')

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
        error
          ? 'border-destructive/40 bg-destructive/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={cn(
            'rounded-full p-2 shrink-0',
            error ? 'bg-destructive/10' : 'bg-primary/10'
          )}
        >
          {error ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : inGracePeriod ? (
            <Clock className="w-4 h-4 text-primary" />
          ) : (
            <Lock className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {error
              ? "That code didn't match"
              : inGracePeriod
                ? 'Session ended — check in now'
                : 'Check in to this session'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {error
              ? 'Double-check the code with the speaker.'
              : inGracePeriod
                ? 'You have a few minutes left to check in before it closes.'
                : 'Enter the check-in code from the speaker.'}
          </p>
        </div>
      </div>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && code.trim() && !pending) {
            void onSubmit(code.trim())
          }
        }}
        disabled={pending}
        autoComplete="one-time-code"
        placeholder="Enter code"
        className={cn(
          'mb-3 font-mono tracking-widest text-center',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      <Button
        className="w-full"
        disabled={!code.trim() || pending}
        onClick={() => { void onSubmit(code.trim()) }}
      >
        {pending ? 'Checking in…' : error ? 'Try again' : 'Check in'}
      </Button>
    </div>
  )
}
