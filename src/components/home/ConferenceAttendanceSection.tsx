import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { fetchUpcomingAttendance } from '@/lib/supabase/queries'
import { cn } from '@/lib/utils'

const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
})

function parseDate(yyyymmdd: string): Date {
  return new Date(`${yyyymmdd}T00:00:00`)
}

export function formatConferenceDateRange(
  startDate: string,
  endDate: string
): string {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (startDate === endDate) return MONTH_DAY.format(start)
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${MONTH_DAY.format(start)} – ${end.getDate()}`
  }
  return `${MONTH_DAY.format(start)} – ${MONTH_DAY.format(end)}`
}

const MONTH_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short' })

/**
 * The date tile's two lines: the start month, and the day or day range
 * ("8–10"). A range that crosses months shows only its first day; the full
 * dates are in the line under the name.
 */
export function conferenceDateTile(startDate: string, endDate: string): { month: string; days: string } {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  const days =
    startDate === endDate || !sameMonth
      ? String(start.getDate())
      : `${start.getDate()}–${end.getDate()}`
  return { month: MONTH_SHORT.format(start), days }
}

/**
 * The member's most-imminent conference, as a light card under the Home hero
 * with a date tile (redesign direction B: the hero is the page's one dark
 * block). Returns null when there is no upcoming attendance within the next
 * 30 days. The dot animates (`animate-status-pulse`) only while the
 * conference is live (today inside the inclusive date range).
 */
export async function ConferenceAttendanceSection() {
  const attendance = await fetchUpcomingAttendance()
  if (!attendance) return null

  const dateRange = formatConferenceDateRange(
    attendance.startDate,
    attendance.endDate
  )
  const tile = conferenceDateTile(attendance.startDate, attendance.endDate)

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary"
      >
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          {tile.month}
        </span>
        <span className="text-lg font-bold leading-none tabular-nums">{tile.days}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="ym-eyebrow inline-flex items-center gap-2 text-success">
          <span
            aria-hidden="true"
            data-testid="conference-status-dot"
            className={cn(
              'inline-block size-2 shrink-0 rounded-full bg-success',
              attendance.isLive && 'animate-status-pulse',
            )}
          />
          {attendance.isLive ? 'Happening now' : 'You’re going'}
        </p>
        <h2 className="mt-1 text-xl font-bold">{attendance.name}</h2>
        <p className="text-sm text-muted-foreground">
          <span>{dateRange}</span>
          {attendance.location && <span> · {attendance.location}</span>}
        </p>
      </div>
      <Link
        href={`/conferences/${attendance.conferenceId}`}
        className="inline-flex min-h-11 w-fit shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[gap] duration-200 hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        View schedule
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
