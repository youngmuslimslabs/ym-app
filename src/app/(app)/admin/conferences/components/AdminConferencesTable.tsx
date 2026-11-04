import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { conferenceDateTile } from '@/components/home/ConferenceAttendanceSection'
import { ConferenceStatusBadge } from './ConferenceStatusBadge'
import type { AdminConferenceRow } from '../types'

interface Props {
  rows: AdminConferenceRow[]
}

export function AdminConferencesTable({ rows }: Props) {
  if (rows.length === 0) return null

  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {rows.map((row) => {
        const tile = conferenceDateTile(row.start_date, row.end_date)
        return (
          <li key={row.id}>
            <Link
              href={`/admin/conferences/${row.id}`}
              className="group flex items-center gap-4 p-4 transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5"
            >
              <div
                aria-hidden="true"
                className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary"
              >
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  {tile.month}
                </span>
                <span className="text-base font-bold leading-none tabular-nums">
                  {tile.days}
                </span>
              </div>
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-6">
                <div className="min-w-0 sm:flex-1">
                  <div className="ym-h3 sm:truncate">{row.name}</div>
                  <div className="text-sm text-muted-foreground sm:truncate">
                    {row.location ? `${row.location} · ` : ''}
                    {formatDateRange(row.start_date, row.end_date)}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm sm:mt-0 sm:shrink-0 sm:gap-6">
                  <span className="whitespace-nowrap text-muted-foreground sm:w-28">
                    {formatRelativeWindow(row.start_date, row.end_date)}
                  </span>
                  <span className="whitespace-nowrap font-medium tabular-nums sm:w-24">
                    {row.invitedCount.toLocaleString()} invited
                  </span>
                  <span className="sm:w-16">
                    <ConferenceStatusBadge
                      status={row.status}
                      start_date={row.start_date}
                      end_date={row.end_date}
                    />
                  </span>
                </div>
              </div>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  if (startISO === endISO) return format(start, 'MMM d, yyyy')
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

function formatRelativeWindow(startISO: string, endISO: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  const dayMs = 24 * 60 * 60 * 1000
  if (start.getTime() > today.getTime()) {
    const days = Math.round((start.getTime() - today.getTime()) / dayMs)
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days < 31) return `In ${days} days`
    const months = Math.round(days / 30)
    return months === 1 ? 'In 1 month' : `In ${months} months`
  }
  if (end.getTime() >= today.getTime()) return 'Happening now'
  const days = Math.round((today.getTime() - end.getTime()) / dayMs)
  if (days < 31) return `${days} days ago`
  const months = Math.round(days / 30)
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`
  const years = Math.round(months / 12)
  return years === 1 ? '1 year ago' : `${years} years ago`
}
