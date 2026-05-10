'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, Edit, KeyRound, MapPin, Search, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useBottomSheetDragToDismiss } from '@/hooks/use-bottom-sheet-drag'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { decomposeTzIso } from '../../lib/datetime'
import type { AdminSession } from '../../types'

interface Props {
  session: AdminSession | null
  timezone: string
  onClose: () => void
  onEdit: () => void
}

interface RosterEntry {
  userId: string
  name: string
  checkedInAt: string | null
}

type Filter = 'all' | 'in' | 'out'

// Roster sheet — opens when an admin clicks a session row body in the
// ScheduleEditor. Snapshot fetched once on open: no realtime, no polling. To
// see fresh data, the admin closes and reopens the sheet (or reloads). See the
// staged-build plan's Stage 5 override note.
export function RosterSheet({ session, timezone, onClose, onEdit }: Props) {
  const isMobile = useIsMobile()
  const [entries, setEntries] = useState<RosterEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const { sheetRef, dragHandleProps } = useBottomSheetDragToDismiss({
    onDismiss: onClose,
  })

  // Reset state when the targeted session changes — otherwise opening a second
  // session would briefly show the previous roster.
  useEffect(() => {
    if (!session) return
    setEntries(null)
    setError(null)
    setFilter('all')
    setSearch('')

    let cancelled = false
    void loadRoster(session.id).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setEntries(res.entries)
    })
    return () => {
      cancelled = true
    }
  }, [session])

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

  if (!session) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent />
      </Sheet>
    )
  }

  const startWall = decomposeTzIso(session.start_at, timezone)
  const endWall = decomposeTzIso(session.end_at, timezone)
  const side = isMobile ? 'bottom' : 'right'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={isMobile ? sheetRef : undefined}
        side={side}
        className={cn(
          'flex flex-col p-0 gap-0',
          isMobile
            ? 'h-auto max-h-[90vh] rounded-t-xl'
            : 'w-full sm:max-w-lg'
        )}
      >
        {isMobile && (
          <div
            className="flex justify-center pt-2 pb-1 shrink-0 touch-none"
            {...dragHandleProps}
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}

        <SheetHeader className="p-6 border-b text-left space-y-2">
          <div className="flex items-start justify-between">
            <div className="text-xs uppercase tracking-widest text-primary font-medium">
              Roster
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="Edit session"
              className="h-8 w-8 text-muted-foreground -mt-1 -mr-2 shrink-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          <SheetTitle className="text-xl font-semibold tracking-tight">
            {session.title}
          </SheetTitle>
          {session.speaker && (
            <p className="text-sm text-muted-foreground">{session.speaker}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
            <span>{formatTime(startWall.time)} – {formatTime(endWall.time)}</span>
            {session.room && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.room}
                </span>
              </>
            )}
          </div>
        </SheetHeader>

        {session.description && (
          <div className="px-6 py-4 border-b text-sm text-foreground/75 leading-relaxed shrink-0">
            {session.description}
          </div>
        )}

        {(session.capacity != null || session.check_in_code) && (
          <div className="px-6 py-3 border-b flex gap-4 text-xs text-muted-foreground items-center shrink-0">
            {session.capacity != null && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {session.capacity} seats
              </span>
            )}
            {session.check_in_code && (
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Code{' '}
                <span className="font-mono tracking-wider bg-muted px-1.5 py-0.5 rounded text-foreground">
                  {session.check_in_code}
                </span>
              </span>
            )}
          </div>
        )}

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
                <RosterRow key={e.userId} entry={e} timezone={timezone} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
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
            Checked in at {formatTime(decomposeTzIso(entry.checkedInAt, timezone).time)}
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

// ---------------------------------------------------------------------------
// Data fetch — runs in the browser via the public Supabase client. RLS gates
// access (see migration 00013): admins read all signups + check-ins. Two
// parallel queries keyed on session_id, merged on user_id. Names resolve at
// the query level via the embedded users(...) — never a second client lookup.

async function loadRoster(
  sessionId: string
): Promise<{ entries: RosterEntry[]; error: null } | { entries: []; error: string }> {
  const supabase = createClient()
  const [signupsRes, checkInsRes] = await Promise.all([
    supabase
      .from('session_signups')
      .select('user_id, created_at, users(first_name, last_name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }),
    supabase
      .from('session_check_ins')
      .select('user_id, checked_in_at')
      .eq('session_id', sessionId),
  ])

  if (signupsRes.error) return { entries: [], error: signupsRes.error.message }
  if (checkInsRes.error) return { entries: [], error: checkInsRes.error.message }

  const checkInMap = new Map<string, string>()
  for (const c of (checkInsRes.data ?? []) as {
    user_id: string
    checked_in_at: string
  }[]) {
    checkInMap.set(c.user_id, c.checked_in_at)
  }

  // Supabase returns the embedded users row as either an object (one FK) or
  // an array depending on the relation; we narrow defensively.
  type SignupRow = {
    user_id: string
    users:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null
  }
  const entries: RosterEntry[] = ((signupsRes.data ?? []) as SignupRow[]).map(
    (row) => {
      const u = Array.isArray(row.users) ? row.users[0] : row.users
      const first = u?.first_name ?? ''
      const last = u?.last_name ?? ''
      const name = `${first} ${last}`.trim() || 'Unknown attendee'
      return {
        userId: row.user_id,
        name,
        checkedInAt: checkInMap.get(row.user_id) ?? null,
      }
    }
  )

  // Stable order: checked-in first by time, then everyone else by name.
  entries.sort((a, b) => {
    if (a.checkedInAt && b.checkedInAt) {
      return a.checkedInAt.localeCompare(b.checkedInAt)
    }
    if (a.checkedInAt && !b.checkedInAt) return -1
    if (!a.checkedInAt && b.checkedInAt) return 1
    return a.name.localeCompare(b.name)
  })

  return { entries, error: null }
}
