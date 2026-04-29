'use client'

import { useMemo } from 'react'
import { Star } from 'lucide-react'
import { decomposeTzIso } from '../../lib/datetime'
import type { AdminSession, SessionFeedbackAggregate } from '../../types'

interface Props {
  sessions: AdminSession[]
  feedbackBySession: Record<string, SessionFeedbackAggregate>
  timezone: string
  // Derived total — only used for the empty-state branch. Same value the tab
  // count badge consumes upstream, so we pass it through instead of re-summing.
  totalResponses: number
}

interface RankedRow {
  session: AdminSession
  count: number
  avgRating: number | null
}

// Ranked-by-rating list of ended sessions. Sessions with no feedback yet still
// appear (muted "Awaiting first response.") so admins can see what's pending
// rather than wondering where a session went. Empty state only when zero
// feedback rows exist conference-wide.
export function AdminFeedbackTab({
  sessions,
  feedbackBySession,
  timezone,
  totalResponses,
}: Props) {
  const rows = useMemo(() => buildRows(sessions, feedbackBySession), [
    sessions,
    feedbackBySession,
  ])

  if (totalResponses === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
          <Star className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold tracking-tight mb-1.5">
          No feedback yet
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          As sessions wrap up, attendees can rate them and leave comments —
          their responses will rank here automatically.
        </p>
      </div>
    )
  }

  if (rows.length === 0) {
    // Edge case: there's feedback in the DB but no ended sessions in the
    // current view (e.g., all sessions still upcoming). Lands gracefully.
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
          <Star className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold tracking-tight mb-1.5">
          Nothing has ended yet
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Feedback opens up after each session ends.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {totalResponses === 1
          ? '1 response across this conference'
          : `${totalResponses.toLocaleString()} responses across this conference`}
      </div>

      <ul className="rounded-xl border bg-card divide-y overflow-hidden">
        {rows.map((row) => (
          <FeedbackRow key={row.session.id} row={row} timezone={timezone} />
        ))}
      </ul>
    </div>
  )
}

function FeedbackRow({
  row,
  timezone,
}: {
  row: RankedRow
  timezone: string
}) {
  const startWall = decomposeTzIso(row.session.start_at, timezone)
  const dateLabel = formatDateLabel(startWall.date)

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{row.session.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {dateLabel} · {formatTime(startWall.time)}
          {row.session.speaker ? ` · ${row.session.speaker}` : ''}
        </div>
      </div>

      {row.avgRating !== null ? (
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold tabular-nums">
              {row.avgRating.toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums w-20 text-right">
            {row.count === 1 ? '1 response' : `${row.count} responses`}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic shrink-0">
          Awaiting first response
        </div>
      )}
    </li>
  )
}

// ---------------------------------------------------------------------------

function buildRows(
  sessions: AdminSession[],
  feedbackBySession: Record<string, SessionFeedbackAggregate>
): RankedRow[] {
  const now = Date.now()
  const ended = sessions.filter(
    (s) => !s.is_break && new Date(s.end_at).getTime() < now
  )
  const rows: RankedRow[] = ended.map((session) => {
    const agg = feedbackBySession[session.id]
    if (!agg || agg.count === 0) {
      return { session, count: 0, avgRating: null }
    }
    return {
      session,
      count: agg.count,
      avgRating: agg.sum / agg.count,
    }
  })

  // Sort: rated sessions first by avg rating desc, then by response count
  // desc as a tiebreaker; awaiting-feedback sessions sink to the bottom in
  // chronological order (so admins can scan "what's pending next").
  rows.sort((a, b) => {
    if (a.avgRating === null && b.avgRating === null) {
      return a.session.start_at.localeCompare(b.session.start_at)
    }
    if (a.avgRating === null) return 1
    if (b.avgRating === null) return -1
    if (a.avgRating !== b.avgRating) return b.avgRating - a.avgRating
    return b.count - a.count
  })
  return rows
}

function formatDateLabel(date: string): string {
  // date = "YYYY-MM-DD" — render as "Sat, Apr 25". Avoids parseISO/timezone
  // round-trips since the wall-clock is already in the conference timezone.
  const [y, m, d] = date.split('-').map(Number)
  const dateObj = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
