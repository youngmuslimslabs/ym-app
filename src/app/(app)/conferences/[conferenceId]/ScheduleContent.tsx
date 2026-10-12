'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Calendar, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/page-header'
import { cn } from '@/lib/utils'
import type { Side } from '@/lib/side'
import { BRAND_PORTAL_CLASS, brandPortalProps } from './lib/brandPortal'
import { ConferenceOnboardingBanner } from './components/ConferenceOnboardingBanner'
import { getCheckInWindow } from './lib/checkInWindow'
import { DaySchedule } from './components/DaySchedule'
import { SessionSheet } from './components/SessionSheet'
import {
  cancelSignup,
  checkInToSession,
  signupForSession,
  upsertFeedback,
} from './client-actions'
import type { ScheduleView, Session } from './types'

interface Props {
  initialView: ScheduleView
  // The member's side, for the portalled sheet/dialogs (they render outside
  // the route's BrandScope). Null for General.
  side?: Side | null
}

export function ScheduleContent({ initialView, side = null }: Props) {
  const [view, setView] = useState<ScheduleView>(initialView)
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Wrong-code state lives inline in the CheckInDialog (it owns the destructive
  // chrome around the pin input). Everything else surfaces via Sonner toasts.
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())
  // Pending swap when the user tries to sign up for a session that overlaps
  // existing signups. The DB function does an atomic swap, but we surface the
  // replacement up-front so the user explicitly opts in instead of finding out
  // via a post-hoc toast.
  const [pendingSwap, setPendingSwap] = useState<{
    targetId: string
    conflicts: Session[]
  } | null>(null)

  // Tick `now` every 60s so time-derived states (in_progress / ended) update.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const openSession: Session | null = useMemo(
    () => view.sessions.find((s) => s.id === openSessionId) ?? null,
    [view.sessions, openSessionId]
  )

  function closeSheet() {
    setOpenSessionId(null)
    setCheckInError(null)
  }

  function selectSession(id: string) {
    setCheckInError(null)
    setOpenSessionId(id)
  }

  async function handleSignup(sessionId: string) {
    const target = view.sessions.find((s) => s.id === sessionId)
    if (!target) return
    // Mirror the swap rule in signup_for_session (00022): only signups the
    // user could still cancel — sign-up window open, not checked in — get
    // swapped out; everything else is attendance/no-show history and
    // survives, so don't warn about it. Uses a fresh clock, not the 60s-tick
    // `now`, so the dialog can't promise a swap the server won't perform.
    const fresh = new Date()
    const conflicts = view.sessions.filter(
      (s) =>
        s.id !== sessionId &&
        view.mySignupSessionIds.has(s.id) &&
        !view.myCheckInSessionIds.has(s.id) &&
        rangesOverlap(s.start_at, s.end_at, target.start_at, target.end_at) &&
        getCheckInWindow(s.start_at, s.end_at, fresh).signUpOpen
    )
    if (conflicts.length > 0) {
      setPendingSwap({ targetId: sessionId, conflicts })
      return
    }
    await performSignup(sessionId)
  }

  async function performSignup(sessionId: string) {
    setPending(true)
    try {
      const result = await signupForSession(sessionId)
      if (!result.success) {
        toast.error(result.error ?? 'Could not sign up')
        return
      }

      setView((prev) => {
        const newSignups = new Set(prev.mySignupSessionIds)
        const newCounts = { ...prev.signupCounts }
        for (const replacedId of result.replaced_session_ids ?? []) {
          if (newSignups.delete(replacedId)) {
            newCounts[replacedId] = Math.max(0, (newCounts[replacedId] ?? 1) - 1)
          }
        }
        if (!newSignups.has(sessionId)) {
          newSignups.add(sessionId)
          newCounts[sessionId] = (newCounts[sessionId] ?? 0) + 1
        }
        return { ...prev, mySignupSessionIds: newSignups, signupCounts: newCounts }
      })

      toast.success("You're signed up")
    } finally {
      setPending(false)
    }
  }

  async function handleCancel(sessionId: string) {
    setPending(true)
    try {
      const result = await cancelSignup(sessionId)
      if (!result.success) {
        toast.error(result.error ?? 'Could not cancel')
        return
      }
      setView((prev) => {
        const newSignups = new Set(prev.mySignupSessionIds)
        const newCounts = { ...prev.signupCounts }
        if (newSignups.delete(sessionId)) {
          newCounts[sessionId] = Math.max(0, (newCounts[sessionId] ?? 1) - 1)
        }
        return { ...prev, mySignupSessionIds: newSignups, signupCounts: newCounts }
      })
      toast.success('RSVP removed')
    } finally {
      setPending(false)
    }
  }

  async function handleCheckIn(sessionId: string, code: string) {
    setPending(true)
    setCheckInError(null)
    try {
      const result = await checkInToSession(sessionId, code)
      if (!result.success) {
        // Inline error stays in the dialog — it's a validation correction, not a notification.
        setCheckInError(result.error ?? 'Invalid code')
        return
      }
      setView((prev) => {
        const next = new Set(prev.myCheckInSessionIds)
        next.add(sessionId)
        return { ...prev, myCheckInSessionIds: next }
      })
      toast.success(
        result.alreadyCheckedIn ? 'You were already checked in' : "You're checked in"
      )
    } finally {
      setPending(false)
    }
  }

  async function handleSubmitFeedback(
    sessionId: string,
    rating: number,
    comment: string
  ) {
    setPending(true)
    try {
      const wasEdit = sessionId in view.myFeedback
      const result = await upsertFeedback(sessionId, rating, comment)
      if (!result.success || !result.feedback) {
        toast.error(result.error ?? 'Could not save feedback')
        return
      }
      setView((prev) => ({
        ...prev,
        myFeedback: { ...prev.myFeedback, [sessionId]: result.feedback! },
      }))
      toast.success(wasEdit ? 'Feedback updated' : 'Thanks for the feedback')
    } finally {
      setPending(false)
    }
  }

  const { conference } = view
  const dateRangeLabel = formatDateRange(conference.start_date, conference.end_date)

  return (
    <div className="overflow-hidden pb-16">
      <div className="mx-auto max-w-5xl px-6 pt-8 sm:px-10 sm:pt-12">
        <PageHeader
          title={conference.name}
          description={conference.tagline}
        />
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4 shrink-0" aria-hidden="true" />
            {dateRangeLabel}
          </span>
          {conference.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {conference.location}
            </span>
          )}
        </div>
      </div>

      <ConferenceOnboardingBanner conferenceId={conference.id} />

      <DaySchedule
        sessions={view.sessions}
        signupCounts={view.signupCounts}
        mySignupSessionIds={view.mySignupSessionIds}
        myCheckInSessionIds={view.myCheckInSessionIds}
        myFeedback={view.myFeedback}
        timezone={conference.timezone}
        now={now}
        onSelectSession={selectSession}
      />

      <SessionSheet
        session={openSession}
        timezone={conference.timezone}
        signedUp={openSession ? view.mySignupSessionIds.has(openSession.id) : false}
        checkedIn={openSession ? view.myCheckInSessionIds.has(openSession.id) : false}
        feedback={openSession ? view.myFeedback[openSession.id] ?? null : null}
        seatCount={openSession ? view.signupCounts[openSession.id] ?? 0 : 0}
        checkInError={checkInError}
        pending={pending}
        now={now}
        side={side}
        onClose={closeSheet}
        onSignup={handleSignup}
        onCancel={handleCancel}
        onCheckIn={handleCheckIn}
        onSubmitFeedback={handleSubmitFeedback}
      />

      <Dialog
        open={pendingSwap !== null}
        onOpenChange={(next) => {
          if (pending) return
          if (!next) setPendingSwap(null)
        }}
      >
        <DialogContent
          {...brandPortalProps(side)}
          className={cn(BRAND_PORTAL_CLASS, 'sm:max-w-md sm:rounded-2xl')}
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                <ArrowLeftRight className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <DialogTitle className="ym-h3">
                  Replace your current signup?
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {pendingSwap && (
                    <>
                      Signing up for{' '}
                      <span className="text-foreground font-medium">
                        {view.sessions.find((s) => s.id === pendingSwap.targetId)?.title}
                      </span>{' '}
                      will remove your signup for{' '}
                      <span className="text-foreground font-medium">
                        {pendingSwap.conflicts
                          .map((c) => `"${c.title}"`)
                          .join(' and ')}
                      </span>
                      .
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              className="h-11 sm:h-9"
              disabled={pending}
              onClick={() => setPendingSwap(null)}
            >
              Cancel
            </Button>
            <Button
              className="h-11 sm:h-9"
              disabled={pending}
              onClick={async () => {
                if (!pendingSwap) return
                const targetId = pendingSwap.targetId
                setPendingSwap(null)
                await performSignup(targetId)
              }}
            >
              {pending ? 'Signing up…' : 'Yes, replace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd)
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  if (startISO === endISO) return format(start, 'MMMM d, yyyy')
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMMM d')}–${format(end, 'd, yyyy')}`
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}
