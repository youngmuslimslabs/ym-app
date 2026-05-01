'use client'

import { useState } from 'react'
import { CheckCircle2, CircleSlash, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useBottomSheetDragToDismiss } from '@/hooks/use-bottom-sheet-drag'
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
  const isMobile = useIsMobile()
  const { sheetRef, dragHandleProps } = useBottomSheetDragToDismiss({
    onDismiss: onClose,
  })

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
  const showMissedNotice = !isBreak && ended && signedUp && !checkedIn

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(new Date(session.start_at))
  const timeRangeLabel = `${formatTime(session.start_at, timezone)} – ${formatTime(
    session.end_at,
    timezone
  )}`

  // Bottom sheet on mobile (more thumb-friendly), right sheet on tablet+.
  const side = isMobile ? 'bottom' : 'right'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={isMobile ? sheetRef : undefined}
        side={side}
        className={cn(
          'flex flex-col p-0',
          isMobile
            ? 'h-auto max-h-[90vh] rounded-t-xl'
            : 'w-full sm:max-w-md'
        )}
      >
        {isMobile && (
          <div
            className="flex justify-center pt-2 pb-1 shrink-0 touch-none"
            {...dragHandleProps}
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}
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

        <div className={cn('grid border-b text-xs', session.room ? 'grid-cols-2' : 'grid-cols-1')}>
          {session.room && (
            <div className="p-4 border-r">
              <div className="text-muted-foreground uppercase tracking-wider mb-1">Room</div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {session.room}
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
            !showFeedback &&
            !showMissedNotice && (
              <p className="text-sm text-muted-foreground italic">
                No description.
              </p>
            )
          )}

          {showMissedNotice && (
            <div className="rounded-lg border bg-muted/40 p-4 flex items-start gap-3">
              <div className="rounded-full bg-muted p-2 shrink-0">
                <CircleSlash className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium">You didn&apos;t check in</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No worries — feedback isn&apos;t open without a check-in.
                </p>
              </div>
            </div>
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

        <div className="p-6 border-t bg-muted/30 flex justify-center gap-2 shrink-0">
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
              You&apos;ll lose your spot for{' '}
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
