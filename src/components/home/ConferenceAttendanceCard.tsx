import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UpcomingAttendance } from '@/lib/supabase/queries'
import { formatConferenceDateRange } from './conference-dates'

/** Pure presentation shared by the live server section and anonymous review. */
export function ConferenceAttendanceCard({ attendance }: { attendance: UpcomingAttendance | null }) {
  return <section className="space-y-3" aria-labelledby="home-attending">
    <h2 id="home-attending" className="text-lg font-medium leading-tight">Attending</h2>
    {attendance ? <div className="flex flex-col items-start gap-3 rounded-3xl bg-brand-forest p-6 text-white">
      <p className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs leading-[14px]', attendance.isLive ? 'bg-brand-jade text-white' : 'bg-brand-brass text-brand-obsidian')}>
        <span aria-hidden="true" data-testid="conference-status-dot" className={cn('size-2 rounded-full bg-current', attendance.isLive && 'animate-status-pulse motion-reduce:animate-none')} />
        {attendance.isLive ? 'Happening now' : 'Attending'}
      </p>
      <h3 className="text-lg font-medium leading-tight sm:text-xl">{attendance.name}</h3>
      <p className="leading-tight"><span>{formatConferenceDateRange(attendance.startDate, attendance.endDate)}</span>{attendance.location && <span> · {attendance.location}</span>}</p>
      <Button asChild className="mt-1 min-h-11 w-full rounded-[10px] sm:w-auto"><Link href={`/conferences/${attendance.conferenceId}`}>View schedule</Link></Button>
    </div> : <div className="flex items-start gap-3 rounded-3xl border bg-card p-6">
      <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div><p className="font-medium">No upcoming conferences</p><p className="mt-1 text-sm text-muted-foreground">Your next conference will appear here when you are attending.</p></div>
    </div>}
  </section>
}
