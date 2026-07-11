'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, CheckCircle2, Clock, Coffee, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSessionState } from '../lib/checkInWindow'
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
  // Check-in is still solicited (in-session or grace tail) — the card must stay
  // visually active even though it has technically ended, so the "Check in now"
  // CTA doesn't sit on a greyed-out, closed-looking card.
  const pendingCheckIn = slot.kind === 'check-in'

  const capacity = session.capacity
  const full = capacity != null && seatCount >= capacity && !signedUp

  // Card chrome — active/signed-up gets a primary border; full is muted; a truly
  // finished card (ended with no pending check-in) is dimmed.
  const cardClass = cn(
    'rounded-xl border bg-card p-5 md:p-6 shadow-sm relative transition-all duration-200',
    ((signedUp && !ended) || pendingCheckIn) && 'border-2 border-primary bg-primary/5',
    !signedUp && !full && !ended && 'hover:border-foreground/20 hover:shadow-md cursor-pointer',
    full && 'opacity-60 cursor-not-allowed',
    ended && !pendingCheckIn && 'opacity-70'
  )

  return (
    <button
      type="button"
      onClick={full ? undefined : onSelect}
      disabled={full}
      className={cn(cardClass, 'w-full text-left')}
      aria-label={`${session.title} — ${signedUp ? 'signed up' : full ? 'full' : 'available'}`}
    >
      {/* Top-right badges — stacked column so Signed up + Happening now don't overlap */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
        {signedUp && !ended && (
          <span className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold gap-1">
            <Check className="w-3 h-3" />
            Signed up
          </span>
        )}
        {full && (
          <span className="inline-flex items-center rounded-md bg-destructive text-destructive-foreground px-2.5 py-0.5 text-xs font-semibold">
            Full
          </span>
        )}
        {inProgress && (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Happening now
          </span>
        )}
      </div>

      {/* Title + speaker: pr-24 clears the absolute badge in the top-right */}
      <div className="pr-24">
        <h3 className="font-semibold text-base tracking-tight mb-1">{session.title}</h3>
        {session.speaker && (
          <p className="text-sm text-muted-foreground">{session.speaker}</p>
        )}
      </div>

      {/* Description: full card width, clamped to 3 lines with gradient fade */}
      {session.description && upcoming && (
        <ClampedDescription description={session.description} />
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
        {session.room && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {session.room}
          </span>
        )}
        {checkedIn && (
          <span className="inline-flex items-center gap-1.5 text-primary font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Checked in
          </span>
        )}
        {slot.kind === 'check-in' && slot.grace && (
          <span className="inline-flex items-center gap-1.5 text-primary font-medium">
            <Clock className="w-3.5 h-3.5" />
            Check in now
          </span>
        )}
        {slot.kind === 'missed' && (
          <span className="text-muted-foreground">You didn&apos;t check in</span>
        )}
        {slot.kind === 'feedback' && !feedback && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-0.5 font-medium text-foreground">
            <Star className="w-3 h-3" />
            Leave feedback
          </span>
        )}
        {feedback && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            You rated
            <span className="text-primary font-medium tabular-nums">
              {feedback.rating}/5
            </span>
            <Star className="w-3 h-3 text-primary" fill="currentColor" />
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
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setClamped(el.scrollHeight > el.clientHeight)
  }, [description])

  return (
    <div className="relative mt-2 mb-1">
      <p ref={ref} className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
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
    <div className="rounded-xl border border-dashed bg-muted/40 py-5 px-5 flex items-center gap-4">
      <div className="rounded-full bg-muted/50 p-3">
        <Coffee className="w-5 h-5 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-medium text-sm">{session.title}</h3>
        {session.room && (
          <p className="text-xs text-muted-foreground mt-0.5">{session.room}</p>
        )}
      </div>
    </div>
  )
}
