'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Edit,
  MapPin,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { decomposeTzIso } from '../../lib/datetime'
import { loadRoster, type RosterEntry } from './loadRoster'
import type { AdminSession, Conference } from '../../types'

export type PanelMode = 'empty' | 'view' | 'edit' | 'create' | 'delete'
type Filter = 'all' | 'in' | 'out'

interface Props {
  conference: Conference
  sessions: AdminSession[]
  signupCounts: Record<string, number>
  checkInCounts: Record<string, number>
  mode: PanelMode
  selectedSession: AdminSession | null
  createDefaultDate: string | undefined
  onModeChange: (mode: PanelMode, session?: AdminSession | null) => void
  onSaved: (id: string) => void
  onAfterDelete: () => void
  onDirtyChange: (dirty: boolean) => void
}

export function SessionPanel(props: Props) {
  const { mode } = props
  if (mode === 'empty') return <EmptyState />
  if (mode === 'view' && props.selectedSession) {
    return <ViewMode {...props} session={props.selectedSession} />
  }
  // edit / create / delete modes are added in later tasks
  return <EmptyState />
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Calendar className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight mb-1">
        Select a session
      </h3>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
        Click a row on the left to view details, roster, and check-ins.
      </p>
    </div>
  )
}

function ViewMode({
  conference,
  session,
  signupCounts,
  checkInCounts,
  onModeChange,
}: Props & { session: AdminSession }) {
  const startWall = decomposeTzIso(session.start_at, conference.timezone)
  const endWall = decomposeTzIso(session.end_at, conference.timezone)
  const signups = signupCounts[session.id] ?? 0
  const checkIns = checkInCounts[session.id] ?? 0

  const [entries, setEntries] = useState<RosterEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setEntries(null)
    setError(null)
    setFilter('all')
    setSearch('')
    if (session.is_break) return
    let cancelled = false
    void loadRoster(session.id).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setEntries(res.entries)
    })
    return () => {
      cancelled = true
    }
  }, [session.id, session.is_break])

  const filtered = useMemo(() => {
    if (!entries) return []
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (filter === 'in' && e.checkedInAt === null) return false
      if (filter === 'out' && e.checkedInAt !== null) return false
      if (q && !e.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [entries, filter, search])

  const counts = useMemo(() => {
    if (!entries) return { all: 0, in: 0, out: 0 }
    let inCount = 0
    for (const e of entries) if (e.checkedInAt !== null) inCount += 1
    return { all: entries.length, in: inCount, out: entries.length - inCount }
  }, [entries])

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 pb-4 border-b space-y-2">
        <div className="text-xs uppercase tracking-widest text-primary font-medium">
          {session.is_break ? (
            <span className="inline-flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              Break
            </span>
          ) : (
            'Session'
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{session.title}</h2>
        <p className="text-sm text-muted-foreground">
          {format(parseISO(startWall.date), 'EEEE, MMMM d')} ·{' '}
          {formatTime(startWall.time)} – {formatTime(endWall.time)}
        </p>
        {session.room && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {session.room}
          </p>
        )}
      </header>

      {session.description && (
        <div className="px-6 py-4 text-sm leading-relaxed text-foreground/80 border-b">
          {session.description}
        </div>
      )}

      {!session.is_break && (
        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b">
          <Stat
            label="Signed up"
            value={
              session.capacity != null
                ? `${signups} / ${session.capacity}`
                : String(signups)
            }
          />
          <Stat label="Checked in" value={checkIns === 0 ? '—' : String(checkIns)} />
        </div>
      )}

      {!session.is_break ? (
        <>
          <div className="px-6 pt-4 pb-3 border-b space-y-3 shrink-0">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                  <span className="ml-1.5 text-muted-foreground tabular-nums">
                    {counts.all}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="in" className="flex-1">
                  Checked in
                  <span className="ml-1.5 text-muted-foreground tabular-nums">
                    {counts.in}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="out" className="flex-1">
                  Not checked in
                  <span className="ml-1.5 text-muted-foreground tabular-nums">
                    {counts.out}
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendees..."
                aria-label="Search attendees"
                className="pl-9 pr-9 h-9 bg-background"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearch('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {error ? (
              <ErrorState message={error} />
            ) : entries === null ? (
              <LoadingState />
            ) : entries.length === 0 ? (
              <EmptyAll />
            ) : filtered.length === 0 ? (
              <EmptyFiltered hasSearch={search.length > 0} filter={filter} />
            ) : (
              <ul className="divide-y">
                {filtered.map((e) => (
                  <RosterRow key={e.userId} entry={e} timezone={conference.timezone} />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1" />
      )}

      <footer className="px-6 py-3 border-t bg-muted/30 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('delete', session)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
        <Button size="sm" onClick={() => onModeChange('edit', session)}>
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function RosterRow({
  entry,
  timezone,
}: {
  entry: RosterEntry
  timezone: string
}) {
  const checkedIn = entry.checkedInAt !== null
  return (
    <li className="flex items-center gap-3 px-6 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{entry.name}</div>
        {checkedIn && entry.checkedInAt && (
          <div className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Checked in at{' '}
            {formatTime(decomposeTzIso(entry.checkedInAt, timezone).time)}
          </div>
        )}
      </div>
      {checkedIn ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          Checked in
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
          Not checked in
        </span>
      )}
    </li>
  )
}

function LoadingState() {
  return (
    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
      Loading roster…
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function EmptyAll() {
  return (
    <div className="max-w-xs mx-auto py-12 text-center px-6">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Users className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight mb-1">
        Nobody signed up yet
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Attendees who sign up for this session will show up here.
      </p>
    </div>
  )
}

function EmptyFiltered({
  hasSearch,
  filter,
}: {
  hasSearch: boolean
  filter: Filter
}) {
  let label = 'No attendees match'
  if (!hasSearch) {
    if (filter === 'in') label = 'Nobody has checked in yet'
    else if (filter === 'out') label = 'Everyone signed up has checked in'
  }
  return (
    <div className="px-6 py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
