'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Coffee, Edit, Plus, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { decomposeTzIso } from '../../lib/datetime'
import { deleteSession } from '../../client-actions'
import { TypeToConfirmDialog } from '../../components/TypeToConfirmDialog'
import { SessionEditor } from './SessionEditor'
import { RosterSheet } from './RosterSheet'
import type { AdminSession, ConferenceEditorView } from '../../types'

interface Props {
  view: ConferenceEditorView
}

export function ScheduleEditor({ view }: Props) {
  const router = useRouter()
  const { conference, sessions, signupCounts, checkInCounts } = view

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<AdminSession | null>(null)
  const [editorDefaultDate, setEditorDefaultDate] = useState<string | undefined>()
  const [deletingSession, setDeletingSession] = useState<AdminSession | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  // Roster sheet target: clicking a session body opens it. Breaks have no
  // roster so they skip this path; their click is a no-op.
  const [rosterSession, setRosterSession] = useState<AdminSession | null>(null)

  // Group sessions by their wall-clock date in the conference timezone, then
  // by start time. The DaySchedule attendee component computes this same way
  // — see /conferences/[id]/components/DaySchedule.tsx — but we keep the
  // admin variant local because the cards have different actions.
  const groupedDays = useMemo(() => groupByDay(sessions, conference.timezone), [
    sessions,
    conference.timezone,
  ])

  function openCreate(forDate?: string) {
    setEditingSession(null)
    setEditorDefaultDate(forDate)
    setEditorOpen(true)
  }

  function openEdit(session: AdminSession) {
    setEditingSession(session)
    setEditorOpen(true)
  }

  async function handleDeleteConfirmed() {
    if (!deletingSession || deletePending) return
    setDeletePending(true)
    try {
      const result = await deleteSession(deletingSession.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not delete session')
        return
      }
      toast.success(deletingSession.is_break ? 'Break deleted' : 'Session deleted')
      setDeletingSession(null)
      router.refresh()
    } finally {
      setDeletePending(false)
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
            <Calendar className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold tracking-tight mb-1.5">
            No sessions yet
          </h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Add sessions one at a time — each gets its own day, time, speaker,
            room, and capacity.
          </p>
          <Button onClick={() => openCreate()}>
            <Plus className="w-4 h-4" />
            Add first session
          </Button>
        </div>

        <SessionEditor
          open={editorOpen}
          onOpenChange={setEditorOpen}
          conference={conference}
          session={editingSession}
          defaultDate={editorDefaultDate}
          sessions={sessions}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sessions.length} {sessions.length === 1 ? 'item' : 'items'} ·{' '}
          {summarizeProgrammed(groupedDays)}
        </p>
        <Button onClick={() => openCreate()}>
          <Plus className="w-4 h-4" />
          Add session
        </Button>
      </div>

      {groupedDays.map(({ date, sessions: daySessions }) => (
        <section key={date}>
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              {format(parseISO(date), 'EEEE, MMMM d')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {summarizeDay(daySessions)}
            </p>
          </div>

          <div className="space-y-2">
            {daySessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                timezone={conference.timezone}
                signupCount={signupCounts[s.id] ?? 0}
                checkInCount={checkInCounts[s.id] ?? 0}
                onOpenRoster={() => setRosterSession(s)}
                onEdit={() => openEdit(s)}
                onDelete={() => setDeletingSession(s)}
              />
            ))}
            <button
              type="button"
              onClick={() => openCreate(date)}
              className="w-full rounded-lg border border-dashed bg-transparent px-4 py-2 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-muted/40 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3" />
              Add session on {format(parseISO(date), 'EEEE')}
            </button>
          </div>
        </section>
      ))}

      <SessionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        conference={conference}
        session={editingSession}
        defaultDate={editorDefaultDate}
        sessions={sessions}
      />

      <RosterSheet
        session={rosterSession}
        timezone={conference.timezone}
        onClose={() => setRosterSession(null)}
        onEdit={() => {
          if (rosterSession) {
            setRosterSession(null)
            openEdit(rosterSession)
          }
        }}
      />

      <TypeToConfirmDialog
        open={deletingSession !== null}
        onOpenChange={(next) => !next && setDeletingSession(null)}
        title={
          deletingSession?.is_break ? 'Delete this break?' : 'Delete this session?'
        }
        description={
          deletingSession ? (
            <DeleteSessionDescription
              session={deletingSession}
              signupCount={signupCounts[deletingSession.id] ?? 0}
              checkInCount={checkInCounts[deletingSession.id] ?? 0}
            />
          ) : null
        }
        confirmText="delete"
        confirmLabel={
          deletingSession?.is_break ? 'Delete break' : 'Delete session'
        }
        pendingLabel="Deleting…"
        tone="destructive"
        pending={deletePending}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  )
}

function DeleteSessionDescription({
  session,
  signupCount,
  checkInCount,
}: {
  session: AdminSession
  signupCount: number
  checkInCount: number
}) {
  return (
    <>
      Permanently removes{' '}
      <span className="text-foreground font-medium">
        &ldquo;{session.title}&rdquo;
      </span>
      {!session.is_break && (signupCount > 0 || checkInCount > 0) && (
        <>
          {' '}and {signupCount} {signupCount === 1 ? 'signup' : 'signups'}
          {checkInCount > 0
            ? `, ${checkInCount} check-in${checkInCount === 1 ? '' : 's'}`
            : ''}
        </>
      )}
      . This cannot be undone.
    </>
  )
}

function SessionRow({
  session,
  timezone,
  signupCount,
  checkInCount,
  onOpenRoster,
  onEdit,
  onDelete,
}: {
  session: AdminSession
  timezone: string
  signupCount: number
  checkInCount: number
  onOpenRoster: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isFull = session.capacity != null && signupCount >= session.capacity
  const startWall = decomposeTzIso(session.start_at, timezone).time
  const endWall = decomposeTzIso(session.end_at, timezone).time

  if (session.is_break) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 py-4 px-5 flex items-center gap-4">
        <div className="rounded-full bg-muted/50 p-3 shrink-0">
          <Coffee className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{session.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTimeRange(startWall, endWall)}
            {session.room ? ` · ${session.room}` : ''} · break
          </p>
        </div>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card flex items-center gap-4 hover:border-foreground/20 transition-colors">
      <button
        type="button"
        onClick={onOpenRoster}
        aria-label={`Open roster for ${session.title}`}
        className="flex-1 min-w-0 flex items-center gap-4 text-left px-4 py-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{session.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatTimeRange(startWall, endWall)}
            {session.speaker ? ` · ${session.speaker}` : ''}
            {session.room ? ` · ${session.room}` : ''}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-right">
            <div
              className={
                'font-semibold tabular-nums ' +
                (isFull ? 'text-destructive' : '')
              }
            >
              {signupCount}
              {session.capacity != null && (
                <span className="text-muted-foreground font-normal">
                  {' '}/ {session.capacity}
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {isFull ? 'Full' : 'Signed up'}
            </div>
          </div>
          <div className="text-right">
            <div
              className={
                'font-semibold tabular-nums ' +
                (checkInCount === 0 ? 'text-muted-foreground' : '')
              }
            >
              {checkInCount === 0 ? '—' : checkInCount}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Checked in
            </div>
          </div>
        </div>
      </button>
      <div className="pr-3">
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex gap-0.5 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        aria-label="Edit"
        className="h-8 w-8 text-muted-foreground"
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="Delete"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface DayGroup {
  date: string
  sessions: AdminSession[]
}

function groupByDay(sessions: AdminSession[], timezone: string): DayGroup[] {
  const map = new Map<string, AdminSession[]>()
  for (const s of sessions) {
    const day = decomposeTzIso(s.start_at, timezone).date
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(s)
  }
  // sessions are already sorted by start_at ascending, so each bucket keeps
  // chronological order. Sort the day keys themselves to be safe.
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sessions]) => ({ date, sessions }))
}

function summarizeDay(daySessions: AdminSession[]): string {
  const sessions = daySessions.filter((s) => !s.is_break).length
  const breaks = daySessions.filter((s) => s.is_break).length
  const parts: string[] = []
  if (sessions > 0) parts.push(`${sessions} session${sessions === 1 ? '' : 's'}`)
  if (breaks > 0) parts.push(`${breaks} break${breaks === 1 ? '' : 's'}`)
  return parts.join(' · ')
}

function summarizeProgrammed(days: DayGroup[]): string {
  return `${days.length} ${days.length === 1 ? 'day' : 'days'}`
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

function formatTime(hhmm: string): string {
  // hhmm = "09:00" — render as "9:00 AM" for the design-system convention.
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
