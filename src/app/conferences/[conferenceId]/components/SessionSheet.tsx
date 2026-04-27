'use client'

import { useState } from 'react'
import { CheckCircle2, MapPin } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckInDialog } from './CheckInDialog'
import { FeedbackForm } from './FeedbackForm'
import type { Session } from '../types'

interface Props {
  session: Session | null
  timezone: string
  signedUp: boolean
  checkedIn: boolean
  feedback: { rating: number; comment: string | null } | null
  seatCount: number
  checkInError: string | null
  pending: boolean
  now: Date
  onClose: () => void
  onSignup: (sessionId: string) => Promise<void>
  onCancel: (sessionId: string) => Promise<void>
  onCheckIn: (sessionId: string, code: string) => Promise<void>
  onSubmitFeedback: (
    sessionId: string,
    rating: number,
    comment: string
  ) => Promise<void>
}

export function SessionSheet({
  session,
  timezone,
  signedUp,
  checkedIn,
  feedback,
  seatCount,
  checkInError,
  pending,
  now,
  onClose,
  onSignup,
  onCancel,
  onCheckIn,
  onSubmitFeedback,
}: Props) {
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  if (!session) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent />
      </Sheet>
    )
  }

  const startMs = new Date(session.start_at).getTime()
  const endMs = new Date(session.end_at).getTime()
  const ended = now.getTime() >= endMs
  const inProgress = now.getTime() >= startMs && now.getTime() < endMs
  const capacity = session.capacity
  const full = capacity != null && seatCount >= capacity && !signedUp
  const isBreak = session.is_break

  // What slot of the body do we render?
  //  - in-progress + signed up → check-in dialog (or success card if already in)
  //  - ended + checked in       → feedback form (insert OR edit)
  //  - everything else          → description only
  const showCheckIn = !isBreak && inProgress && signedUp
  const showFeedback = !isBreak && ended && checkedIn

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(new Date(session.start_at))
  const timeRangeLabel = `${formatTime(session.start_at, timezone)} – ${formatTime(
    session.end_at,
    timezone
  )}`

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b text-left space-y-2">
          <div className="text-xs uppercase tracking-widest text-primary font-medium">
            {dateLabel} · {timeRangeLabel}
          </div>
          <SheetTitle className="text-2xl font-semibold tracking-tight">
            {session.title}
          </SheetTitle>
          {session.speaker && (
            <p className="text-sm text-muted-foreground">{session.speaker}</p>
          )}
          {showFeedback && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              You checked in
            </p>
          )}
        </SheetHeader>

        <div className="grid grid-cols-3 border-b text-xs">
          {session.room && (
            <div className="p-4 border-r">
              <div className="text-muted-foreground uppercase tracking-wider mb-1">Room</div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {session.room}
              </div>
            </div>
          )}
          {capacity != null && (
            <div className="p-4 border-r">
              <div className="text-muted-foreground uppercase tracking-wider mb-1">Seats</div>
              <div className="text-sm font-medium tabular-nums">
                {seatCount} <span className="text-muted-foreground font-normal">/ {capacity}</span>
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="text-muted-foreground uppercase tracking-wider mb-1">Status</div>
            <div className="text-sm font-medium">
              {ended ? 'Ended' : inProgress ? 'In progress' : 'Upcoming'}
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {session.description ? (
            <p className="text-sm text-foreground/80 leading-relaxed">
              {session.description}
            </p>
          ) : (
            !showCheckIn &&
            !showFeedback && (
              <p className="text-sm text-muted-foreground italic">
                No description.
              </p>
            )
          )}

          {showCheckIn && (
            <CheckInDialog
              alreadyCheckedIn={checkedIn}
              pending={pending}
              error={checkInError}
              onSubmit={(code) => onCheckIn(session.id, code)}
            />
          )}

          {showFeedback && (
            <FeedbackForm
              existing={feedback}
              pending={pending}
              onSubmit={(rating, comment) =>
                onSubmitFeedback(session.id, rating, comment)
              }
            />
          )}
        </div>

        <div className="p-6 border-t bg-muted/30 flex justify-center gap-2">
          {isBreak ? (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          ) : signedUp && !ended && !inProgress ? (
            <Button
              variant="link-destructive"
              size="sm"
              disabled={pending}
              onClick={() => setConfirmRemoveOpen(true)}
            >
              Remove RSVP
            </Button>
          ) : signedUp ? null : ended ? (
            <Button variant="outline" className="flex-1" disabled>
              Session has ended
            </Button>
          ) : full ? (
            <Button variant="outline" className="flex-1" disabled>
              Session full
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={pending}
              onClick={() => onSignup(session.id)}
            >
              {pending ? 'Signing up…' : 'Sign up'}
            </Button>
          )}
        </div>
      </SheetContent>

      <Dialog
        open={confirmRemoveOpen}
        onOpenChange={(open) => !pending && setConfirmRemoveOpen(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove your RSVP?</DialogTitle>
            <DialogDescription>
              You'll lose your spot for{' '}
              <span className="font-medium text-foreground">{session.title}</span>
              {capacity != null
                ? '. If the session fills up before you re-RSVP, you may not get a seat back.'
                : '.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmRemoveOpen(false)}
            >
              Keep RSVP
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                await onCancel(session.id)
                setConfirmRemoveOpen(false)
              }}
            >
              {pending ? 'Removing…' : 'Remove RSVP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}

function formatTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
