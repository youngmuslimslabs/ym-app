'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { DaySchedule } from './components/DaySchedule'
import { SessionSheet } from './components/SessionSheet'
import {
  cancelSignup,
  checkInToSession,
  signupForSession,
  upsertFeedback,
} from './actions'
import type { ScheduleView, Session } from './types'

interface Props {
  initialView: ScheduleView
}

export function ScheduleContent({ initialView }: Props) {
  const [view, setView] = useState<ScheduleView>(initialView)
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  // Wrong-code state lives inline in the CheckInDialog (it owns the destructive
  // chrome around the pin input). Everything else surfaces via Sonner toasts.
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(() => new Date())

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

      const replacedCount = result.replaced_session_ids?.length ?? 0
      if (replacedCount > 0) {
        const replacedTitle =
          view.sessions.find((s) => s.id === result.replaced_session_ids![0])?.title ??
          'previous session'
        toast.success(`Switched from "${replacedTitle}"`)
      } else {
        toast.success("You're signed up")
      }
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
    <div className="overflow-hidden">
      <header className="px-6 md:px-8 pt-10 md:pt-12 pb-6 border-b">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          {conference.name}
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          {conference.tagline ?? conference.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {dateRangeLabel}
          </span>
          {conference.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {conference.location}
            </span>
          )}
        </div>
      </header>

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
        onClose={closeSheet}
        onSignup={handleSignup}
        onCancel={handleCancel}
        onCheckIn={handleCheckIn}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  )
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
