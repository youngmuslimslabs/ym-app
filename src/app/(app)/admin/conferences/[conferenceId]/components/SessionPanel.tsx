'use client'

import { Calendar, Coffee, Edit, MapPin, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { decomposeTzIso } from '../../lib/datetime'
import type { AdminSession, Conference } from '../../types'

export type PanelMode = 'empty' | 'view' | 'edit' | 'create' | 'delete'

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

      {/* Roster section added in Task 3. */}
      <div className="flex-1" />

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

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
