import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { fetchUpcomingAttendance } from '@/lib/supabase/queries'

interface ConferenceAttendanceSectionProps {
  userId: string
}

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

/**
 * Renders the user's most-imminent conference attendance, between the
 * home page greeting and the hairline rule. Returns null when there is
 * no upcoming attendance within the next 30 days. The dot animates
 * (`animate-status-pulse`) only while the conference is live (today
 * inside the inclusive date range).
 */
export async function ConferenceAttendanceSection({
  userId,
}: ConferenceAttendanceSectionProps) {
  const attendance = await fetchUpcomingAttendance(userId)
  if (!attendance) return null

  const dateRange = formatConferenceDateRange(
    attendance.startDate,
    attendance.endDate
  )

  return (
    <section className="mt-12">
      <div className="mb-3.5 inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-primary">
        <span
          aria-hidden="true"
          className={`inline-block size-[7px] shrink-0 rounded-full bg-success${
            attendance.isLive ? ' animate-status-pulse' : ''
          }`}
        />
        Attending
      </div>
      <h2 className="text-[1.375rem] font-medium leading-[1.25] tracking-tight">
        {attendance.name}
      </h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{dateRange}</p>
      <Link
        href={`/conferences/${attendance.conferenceId}`}
        className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary transition-[gap] duration-200 hover:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        View schedule
        <ChevronRight className="size-3.5" />
      </Link>
    </section>
  )
}
