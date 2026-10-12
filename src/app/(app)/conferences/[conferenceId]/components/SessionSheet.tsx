'use client'

import { useEffect, useState } from 'react'
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
import { canRemoveSignUp, canSignUp, getSessionState } from '../lib/checkInWindow'
import { BRAND_PORTAL_CLASS, brandPortalProps } from '../lib/brandPortal'
import type { Side } from '@/lib/side'
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
  // Re-applies the brand scope to the portalled sheet and dialog.
  side?: Side | null
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
  side = null,
  onClose,
  onSignup,
  onCancel,
  onCheckIn,
  onSubmitFeedback,
}: Props) {
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
  // Once the check-in form is shown for an open session, keep it mounted even if
  // a background `now` tick pushes past the grace window mid-entry — otherwise
  // the slot would flip to 'missed', unmounting CheckInDialog and discarding a
  // code the attendee is actively typing. Reset when the open session changes.
  const [checkInSticky, setCheckInSticky] = useState(false)
  const isMobile = useIsMobile()
  const { sheetRef, dragHandleProps } = useBottomSheetDragToDismiss({
    onDismiss: onClose,
  })

  // Compute state before the early return so the latch effects have a stable
  // slot kind to depend on (hooks must run unconditionally).
  const sessionId = session?.id ?? null
  const state = session
    ? getSessionState({
        startAt: session.start_at,
        endAt: session.end_at,
        isBreak: session.is_break,
        signedUp,
        checkedIn,
        hasFeedback: feedback != null,
        now,
      })
    : null
  const slotKind = state?.slot.kind ?? 'none'

  useEffect(() => {
    setCheckInSticky(false)
  }, [sessionId])
  useEffect(() => {
    if (slotKind === 'check-in') setCheckInSticky(true)
  }, [slotKind])

  if (!session || !state) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent />
      </Sheet>
    )
  }

  const isBreak = session.is_break
  const { slot, window: w } = state
  const { inProgress, ended } = w
  const capacity = session.capacity
  const full = capacity != null && seatCount >= capacity && !signedUp
  const joinable = canSignUp(w, { isBreak, signedUp, full })
  const removable = canRemoveSignUp(w, { signedUp, checkedIn })

  // Body slot (see lib/checkInWindow). Check-in stays open through the 60-min
  // grace tail; the "missed check-in" notice only appears once it closes — and
  // never while the sticky latch is holding a mid-entry check-in open.
  const stickyCheckIn = checkInSticky && !checkedIn && slot.kind === 'missed'
  const showCheckInForm = slot.kind === 'check-in' || stickyCheckIn
  const showCheckedInWaiting = slot.kind === 'checked-in'
  const showFeedback = slot.kind === 'feedback'
  const showMissedNotice = slot.kind === 'missed' && !stickyCheckIn
  const inGracePeriod = (slot.kind === 'check-in' && slot.grace) || stickyCheckIn
  const hasBodySlot =
    showCheckInForm || showCheckedInWaiting || showFeedback || showMissedNotice

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(new Date(session.start_at))
  const timeRangeLabel = `${formatTime(session.start_at, timezone)} – ${formatTime(
    session.end_at,
    timezone
  )}`

  // Bottom sheet on mobile (more thumb-friendly), right sheet on tablet+.
  const sheetSide = isMobile ? 'bottom' : 'right'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={isMobile ? sheetRef : undefined}
        side={sheetSide}
        {...brandPortalProps(side)}
        className={cn(
          BRAND_PORTAL_CLASS,
          'flex flex-col p-0',
          isMobile
            ? 'h-auto max-h-[90vh] rounded-t-3xl'
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
        <SheetHeader className="space-y-2 border-b p-6 pr-14 text-left">
          <div className="ym-eyebrow text-primary">
            {dateLabel} · {timeRangeLabel}
          </div>
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="ym-h2 text-balance">
              {session.title}
            </SheetTitle>
            {full && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                Full
              </span>
            )}
          </div>
          {session.speaker && (
            <p className="text-sm text-muted-foreground">{session.speaker}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {session.room && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {session.room}
              </span>
            )}
            <span className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              inProgress ? 'bg-success/10 text-success' : 'bg-secondary text-secondary-foreground'
            )}>
              {inProgress && <span className="size-1.5 rounded-full bg-success animate-status-pulse" aria-hidden="true" />}
              {ended
                ? w.inGrace
                  ? 'Ended · check-in open'
                  : 'Ended'
                : inProgress
                  ? 'In progress'
                  : 'Upcoming'}
            </span>
            {showFeedback && (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                Checked in
              </span>
            )}
          </div>
        </SheetHeader>

        <div className={cn('p-6 flex-1 overflow-y-auto space-y-6', full && 'opacity-60')}>
          {session.description ? (
            <p className="text-sm leading-relaxed text-foreground/80">
              {session.description}
            </p>
          ) : (
            !hasBodySlot && (
              <p className="text-sm text-muted-foreground italic">
                No description.
              </p>
            )
          )}

          {showMissedNotice && (
            <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
              <div className="shrink-0 rounded-full bg-muted/50 p-2.5">
                <CircleSlash className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="ym-h3 text-sm">You didn&apos;t check in</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No worries — feedback isn&apos;t open without a check-in.
                </p>
              </div>
            </div>
          )}

          {(showCheckInForm || showCheckedInWaiting) && (
            <CheckInDialog
              alreadyCheckedIn={showCheckedInWaiting}
              inGracePeriod={inGracePeriod}
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

        <div className="flex shrink-0 justify-center gap-2 border-t bg-muted/30 p-6">
          {isBreak ? (
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>
              Close
            </Button>
          ) : removable ? (
            <Button
              variant="link-destructive"
              size="sm"
              className="min-h-11"
              disabled={pending}
              onClick={() => setConfirmRemoveOpen(true)}
            >
              Remove RSVP
            </Button>
          ) : signedUp ? null : joinable ? (
            <Button
              className="h-11 flex-1"
              disabled={pending}
              onClick={() => onSignup(session.id)}
            >
              {pending ? 'Signing up…' : 'Sign up'}
            </Button>
          ) : !w.signUpOpen ? (
            <Button variant="outline" className="h-11 flex-1" disabled>
              Session has ended
            </Button>
          ) : (
            <Button variant="outline" className="h-11 flex-1" disabled>
              Session full
            </Button>
          )}
        </div>
      </SheetContent>

      <Dialog
        open={confirmRemoveOpen}
        onOpenChange={(open) => !pending && setConfirmRemoveOpen(open)}
      >
        <DialogContent
          {...brandPortalProps(side)}
          className={cn(BRAND_PORTAL_CLASS, 'sm:max-w-md sm:rounded-2xl')}
        >
          <DialogHeader>
            <DialogTitle className="ym-h3">Remove your RSVP?</DialogTitle>
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
              className="h-11 sm:h-9"
              disabled={pending}
              onClick={() => setConfirmRemoveOpen(false)}
            >
              Keep RSVP
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-9"
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
