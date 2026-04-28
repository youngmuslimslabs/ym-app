'use client'

import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  alreadyCheckedIn: boolean
  pending: boolean
  // Parent-supplied error from the last RPC attempt. When non-null, the form
  // renders destructive chrome and the digits remain so the user can edit.
  error: string | null
  onSubmit: (code: string) => Promise<void>
}

const CODE_LENGTH = 4

export function CheckInDialog({
  alreadyCheckedIn,
  pending,
  error,
  onSubmit,
}: Props) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array(CODE_LENGTH).fill('')
  )
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (alreadyCheckedIn) setDigits(Array(CODE_LENGTH).fill(''))
  }, [alreadyCheckedIn])

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

  const code = digits.join('')
  const complete = code.length === CODE_LENGTH

  function focusIndex(i: number) {
    inputRefs.current[i]?.focus()
    inputRefs.current[i]?.select()
  }

  function handleChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    // SMS / paste autofill writes the entire code into one input — splay it out.
    if (raw.length > 1) {
      setDigits((prev) => {
        const next = [...prev]
        for (let j = 0; j < CODE_LENGTH; j++) {
          // Take from the autofill string starting at the current input index.
          next[j] = j < i ? prev[j] : raw[j - i] ?? ''
        }
        return next
      })
      const lastFilled = Math.min(i + raw.length, CODE_LENGTH) - 1
      focusIndex(Math.min(lastFilled + 1, CODE_LENGTH - 1))
      return
    }
    const cleaned = raw.slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[i] = cleaned
      return next
    })
    if (cleaned && i < CODE_LENGTH - 1) focusIndex(i + 1)
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setDigits((prev) => {
        const next = [...prev]
        next[i - 1] = ''
        return next
      })
      focusIndex(i - 1)
      return
    }
    if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault()
      focusIndex(i - 1)
    } else if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) {
      e.preventDefault()
      focusIndex(i + 1)
    } else if (e.key === 'Enter' && complete && !pending) {
      e.preventDefault()
      void onSubmit(code)
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, CODE_LENGTH)
    if (!pasted) return
    e.preventDefault()
    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < CODE_LENGTH; i++) next[i] = pasted[i] ?? ''
      return next
    })
    focusIndex(Math.min(pasted.length, CODE_LENGTH - 1))
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
          ) : (
            <Lock className="w-4 h-4 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">
            {error ? "That code didn't match" : 'Check in to this session'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {error
              ? 'Double-check the code with the speaker.'
              : 'Enter the 4-character code from the speaker.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-center mb-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            disabled={pending}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Code character ${i + 1} of ${CODE_LENGTH}`}
            className={cn(
              'h-12 w-11 rounded-md bg-background text-center font-mono text-lg shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50',
              error ? 'ring-2 ring-destructive border border-destructive' : 'border border-input'
            )}
          />
        ))}
      </div>
      <Button
        className="w-full"
        disabled={!complete || pending}
        onClick={() => onSubmit(code)}
      >
        {pending ? 'Checking in…' : error ? 'Try again' : 'Check in'}
      </Button>
    </div>
  )
}
