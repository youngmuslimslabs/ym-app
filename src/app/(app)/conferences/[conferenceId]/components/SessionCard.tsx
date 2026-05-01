'use client'

import { Check, CheckCircle2, Coffee, MapPin, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  const startMs = new Date(session.start_at).getTime()
  const endMs = new Date(session.end_at).getTime()
  const nowMs = now.getTime()

  const inProgress = nowMs >= startMs && nowMs < endMs
  const ended = nowMs >= endMs
  const upcoming = !inProgress && !ended

  const capacity = session.capacity
  const full = capacity != null && seatCount >= capacity && !signedUp

  // Card chrome — selected gets a primary border, full is muted, ended is dimmed.
  const cardClass = cn(
    'rounded-xl border bg-card p-5 md:p-6 shadow-sm relative transition-all duration-200',
    signedUp && !ended && 'border-2 border-primary bg-primary/5',
    !signedUp && !full && !ended && 'hover:border-foreground/20 hover:shadow-md cursor-pointer',
    full && 'opacity-60 cursor-not-allowed',
    ended && 'opacity-70'
  )

  return (
    <button
      type="button"
      onClick={full ? undefined : onSelect}
      disabled={full}
      className={cn(cardClass, 'w-full text-left')}
      aria-label={`${session.title} — ${signedUp ? 'signed up' : full ? 'full' : 'available'}`}
    >
      {/* Top-right badge */}
      {signedUp && !ended && (
        <span className="absolute top-4 right-4 inline-flex items-center rounded-md bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold gap-1">
          <Check className="w-3 h-3" />
          Signed up
        </span>
      )}
      {full && (
        <span className="absolute top-4 right-4 inline-flex items-center rounded-md bg-destructive text-destructive-foreground px-2.5 py-0.5 text-xs font-semibold">
          Full
        </span>
      )}
      {inProgress && signedUp && (
        <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Happening now
        </span>
      )}

      <div className="pr-24">
        <h3 className="font-semibold text-base tracking-tight mb-1">{session.title}</h3>
        {session.speaker && (
          <p className="text-sm text-muted-foreground mb-2">{session.speaker}</p>
        )}
        {session.description && upcoming && (
          <p className="text-sm text-foreground/80 leading-relaxed max-w-prose mb-3">
            {session.description}
          </p>
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
          {ended && signedUp && !checkedIn && (
            <span className="text-muted-foreground">You didn&apos;t check in</span>
          )}
          {ended && checkedIn && !feedback && (
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
      </div>
    </button>
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
