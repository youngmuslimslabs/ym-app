import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConferenceStatusBadge } from './ConferenceStatusBadge'
import type { AdminConferenceRow } from '../types'

interface Props {
  rows: AdminConferenceRow[]
  // "active" hides the "invited" column header label cosmetic: same columns,
  // both variants. Past rows are dimmed.
  variant: 'active' | 'past'
}

export function AdminConferencesTable({ rows, variant }: Props) {
  if (rows.length === 0) return null

  return (
    <div
      className={
        'rounded-xl border overflow-hidden ' +
        (variant === 'past' ? 'opacity-80' : '')
      }
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Conference</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Attendees</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/30">
              <TableCell className="p-0">
                <Link
                  href={`/admin/conferences/${row.id}`}
                  className="block px-4 py-3"
                >
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.location ? `${row.location} · ` : ''}
                    {formatDateRange(row.start_date, row.end_date)}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatRelativeWindow(row.start_date, row.end_date)}
              </TableCell>
              <TableCell className="tabular-nums text-sm">
                {row.invitedCount.toLocaleString()} invited
              </TableCell>
              <TableCell>
                <ConferenceStatusBadge
                  status={row.status}
                  start_date={row.start_date}
                  end_date={row.end_date}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link
                  href={`/admin/conferences/${row.id}`}
                  className="block"
                  aria-label={`Open ${row.name}`}
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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
