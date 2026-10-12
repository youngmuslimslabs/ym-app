'use client'

import { useRef } from 'react'
import { Check, CheckCircle2, Clock, Coffee, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsClamped } from '@/hooks/use-is-clamped'
import { canSignUp, getSessionState } from '../lib/checkInWindow'
import type { Session } from '../types'

interface Props {
  session: Session
  signedUp: boolean
  checkedIn: boolean
  feedback?: { rating: number; comment: string | null }
  seatCount: number
  now: Date
  onSelect: () => void
}

export function SessionCard({
  session,
  signedUp,
  checkedIn,
  feedback,
  seatCount,
  now,
  onSelect,
}: Props) {
  if (session.is_break) {
    return <BreakCard session={session} />
  }

  // Share the exact state machine the detail sheet uses, so a card badge and the
  // sheet body can never disagree about the same session.
  const { slot, window: w } = getSessionState({
    startAt: session.start_at,
    endAt: session.end_at,
    isBreak: false,
    signedUp,
    checkedIn,
    hasFeedback: feedback != null,
    now,
  })
  const { inProgress, ended } = w
  const upcoming = !inProgress && !ended
  // Chrome rule: a card stays visually ACTIVE while it still wants an action
  // from the attendee — an open check-in (in-session or grace tail) or an
  // unanswered feedback prompt. It only dims once it has nothing left to ask
  // (feedback submitted, check-in missed, or a session they never joined).
  const pendingCheckIn = slot.kind === 'check-in'
  const wantsAction = pendingCheckIn || (slot.kind === 'feedback' && !feedback)

  const capacity = session.capacity
  const full = capacity != null && seatCount >= capacity && !signedUp
  // RSVP stays open through the grace tail (same window as check-in), so a
  // never-signed-up card remains joinable — clickable and undimmed — until
  // sign-up closes at end + grace. Same rule the sheet footer uses.
  const joinable = canSignUp(w, { isBreak: false, signedUp, full })

  // Card chrome — active/signed-up gets a primary border; full is muted; a truly
  // finished card (ended, nothing left to do or join) is dimmed.
  const cardClass = cn(
    'relative rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 sm:p-6',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ((signedUp && !ended) || wantsAction) && 'border-primary/50 bg-primary/5',
    wantsAction && 'border-primary ring-1 ring-primary',
    joinable && 'hover:border-foreground/20 hover:shadow-md cursor-pointer',
    full && 'opacity-60 cursor-not-allowed',
    ended && !wantsAction && !joinable && 'opacity-70'
  )

  const showSignedUp = signedUp && (!ended || pendingCheckIn)
  const hasStatusRow = showSignedUp || full || inProgress

  return (
    <button
      type="button"
      onClick={full ? undefined : onSelect}
      disabled={full}
      className={cn(cardClass, 'w-full text-left')}
      aria-label={`${session.title} — ${signedUp ? 'signed up' : full ? 'full' : joinable ? 'available' : 'ended'}`}
    >
      {/* Status row: its own line above the title, so long titles never run under a badge */}
      {hasStatusRow && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {inProgress && (
            <span className="ym-eyebrow inline-flex items-center gap-2 text-success">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-success animate-status-pulse"
              />
              Happening now
            </span>
          )}
          {showSignedUp && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              <Check className="size-3" aria-hidden="true" />
              Signed up
            </span>
          )}
          {full && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              Full
            </span>
          )}
        </div>
      )}

      <div>
        <h3 className="ym-h3 text-balance">{session.title}</h3>
        {session.speaker && (
          <p className="mt-0.5 text-sm text-muted-foreground">{session.speaker}</p>
        )}
      </div>

      {/* Description: full card width, clamped to 3 lines with gradient fade */}
      {session.description && upcoming && (
        <ClampedDescription description={session.description} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {session.room && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {session.room}
          </span>
        )}
        {checkedIn && (
          <span className="inline-flex items-center gap-1.5 font-medium text-success">
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Checked in
          </span>
        )}
        {slot.kind === 'check-in' && slot.grace && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            Check in now
          </span>
        )}
        {slot.kind === 'missed' && (
          <span className="text-muted-foreground">You didn&apos;t check in</span>
        )}
        {slot.kind === 'feedback' && !feedback && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 font-semibold text-primary-foreground">
            <Star className="size-3 shrink-0" aria-hidden="true" />
            Leave feedback
          </span>
        )}
        {feedback && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            You rated
            <span className="font-semibold tabular-nums text-foreground">
              {feedback.rating}/5
            </span>
            <Star className="size-3 text-primary" fill="currentColor" aria-hidden="true" />
          </span>
        )}
      </div>
    </button>
  )
}

// Extracted so the ref/state don't bloat SessionCard's render path for
// sessions without descriptions (breaks, ended sessions).
function ClampedDescription({ description }: { description: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const clamped = useIsClamped(ref, [description])

  return (
    <div className="relative mt-2 mb-1">
      <p ref={ref} className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
        {description}
      </p>
      {/* from-card matches bg-card; the bg-primary/5 tint on signed-up cards is imperceptible at 5% opacity */}
      {clamped && (
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
      )}
    </div>
  )
}

function BreakCard({ session }: { session: Session }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed bg-muted/40 px-5 py-4 sm:px-6">
      <div className="rounded-full bg-muted/50 p-3">
        <Coffee className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{session.title}</h3>
        {session.room && (
          <p className="text-xs text-muted-foreground mt-0.5">{session.room}</p>
        )}
      </div>
    </div>
  )
}
