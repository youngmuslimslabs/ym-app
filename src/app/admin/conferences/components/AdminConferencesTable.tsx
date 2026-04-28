import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ConferenceStatusBadge } from './ConferenceStatusBadge'
import type { AdminConferenceRow } from '../types'

interface Props {
  rows: AdminConferenceRow[]
}

export function AdminConferencesTable({ rows }: Props) {
  if (rows.length === 0) return null

  return (
    <ul className="rounded-xl border overflow-hidden divide-y">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/admin/conferences/${row.id}`}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{row.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {row.location ? `${row.location} · ` : ''}
                {formatDateRange(row.start_date, row.end_date)}
              </div>
            </div>
            <div className="text-muted-foreground text-sm whitespace-nowrap">
              {formatRelativeWindow(row.start_date, row.end_date)}
            </div>
            <div className="tabular-nums text-sm whitespace-nowrap">
              {row.invitedCount.toLocaleString()} invited
            </div>
            <div>
              <ConferenceStatusBadge
                status={row.status}
                start_date={row.start_date}
                end_date={row.end_date}
              />
            </div>
            <ArrowRight
              className="w-4 h-4 text-muted-foreground"
              aria-hidden
            />
          </Link>
        </li>
      ))}
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
