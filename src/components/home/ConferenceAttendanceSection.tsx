import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { BrandBlob } from '@/components/brand/blob'
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

/**
 * Renders the user's most-imminent conference attendance as a dark card
 * under the Home hero. Returns null when there is
 * no upcoming attendance within the next 30 days. The dot animates
 * (`animate-status-pulse`) only while the conference is live (today
 * inside the inclusive date range).
 */
export async function ConferenceAttendanceSection() {
  const attendance = await fetchUpcomingAttendance()
  if (!attendance) return null

  const dateRange = formatConferenceDateRange(
    attendance.startDate,
    attendance.endDate
  )

  return (
    <section className="relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl bg-foreground p-6 text-background sm:flex-row sm:items-end sm:justify-between sm:p-8">
      <BrandBlob
        shape="cloud"
        rotate={-20}
        className="absolute -bottom-20 -right-16 -z-10 size-44 text-highlight/90 sm:-bottom-24 sm:size-64"
      />
      <div className="min-w-0">
        <div className="ym-eyebrow mb-3 inline-flex items-center gap-2 text-highlight">
          <span
            aria-hidden="true"
            data-testid="conference-status-dot"
            className={cn(
              'inline-block size-2 shrink-0 rounded-full bg-highlight',
              attendance.isLive && 'animate-status-pulse',
            )}
          />
          Attending
        </div>
        <h2 className="ym-h1">{attendance.name}</h2>
        <p className="mt-1 text-background/75">{dateRange}</p>
      </div>
      <Link
        href={`/conferences/${attendance.conferenceId}`}
        className="inline-flex min-h-11 w-fit shrink-0 items-center gap-1.5 rounded-full bg-background px-5 text-sm font-semibold text-foreground transition-[gap] duration-200 hover:gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
      >
        View schedule
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
