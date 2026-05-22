'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Calendar, Coffee, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { decomposeTzIso } from '../../lib/datetime'
import { SessionPanel, type PanelMode } from './SessionPanel'
import type { AdminSession, ConferenceEditorView } from '../../types'

export interface ScheduleEditorHandle {
  openCreate: (date?: string) => void
}

interface Props {
  view: ConferenceEditorView
}

export const ScheduleEditor = forwardRef<ScheduleEditorHandle, Props>(
  function ScheduleEditor({ view }, ref) {
    const { conference, sessions, signupCounts, checkInCounts } = view

    const [mode, setMode] = useState<PanelMode>('empty')
    const [selectedSession, setSelectedSession] = useState<AdminSession | null>(
      null
    )
    const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>()
    const [pendingSavedId, setPendingSavedId] = useState<string | null>(null)
    const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)

    // Track dirty state via a ref so attemptNav (called from the imperative
    // handle and from stale closures) always reads the latest value. The
    // callback must be stable identity: SessionPanel's cleanup effect lists
    // it in deps, and an inline arrow would re-fire on every parent render —
    // briefly clearing the dirty flag mid-form and bypassing the guard.
    const dirtyRef = useRef(false)
    const handlePanelDirtyChange = useCallback((dirty: boolean) => {
      dirtyRef.current = dirty
    }, [])

    // Monotonic nonce: bumped on every openCreate so the create-mode FormMode
    // remounts even when the same default date is reused. Without this, double-
    // clicking the header "Add session" with the same date would keep the prior
    // form's half-typed state.
    const [createNonce, setCreateNonce] = useState(0)

    function attemptNav(action: () => void) {
      if (dirtyRef.current) setPendingNav(() => action)
      else action()
    }

    // After a successful save (create or edit), router.refresh() repopulates
    // `view.sessions`. When the matching row arrives, flip the panel to view
    // mode against the fresh reference so the user sees the latest values.
    // TODO: if the saved row never appears (RLS scope change, server filtering,
    // refresh failure), pendingSavedId sits forever and the panel stays on the
    // form. Add a ~3s timeout fallback that clears the id and shows a "saved,
    // reload to see it" toast.
    useEffect(() => {
      if (!pendingSavedId) return
      const fresh = sessions.find((s) => s.id === pendingSavedId)
      if (fresh) {
        setSelectedSession(fresh)
        setMode('view')
        setPendingSavedId(null)
      }
    }, [sessions, pendingSavedId])

    // useCallback gives openCreate a stable identity so the imperative handle
    // doesn't rebuild every render. Safe with empty deps: dirtyRef is a ref,
    // and the setState calls are stable.
    const openCreate = useCallback((forDate?: string) => {
      const action = () => {
        setSelectedSession(null)
        setCreateDefaultDate(forDate)
        setCreateNonce((n) => n + 1)
        setMode('create')
      }
      if (dirtyRef.current) setPendingNav(() => action)
      else action()
    }, [])

    useImperativeHandle(ref, () => ({ openCreate }), [openCreate])

    const groupedDays = useMemo(
      () => groupByDay(sessions, conference.timezone),
      [sessions, conference.timezone]
    )

    function selectSession(s: AdminSession) {
      setSelectedSession(s)
      setMode('view')
    }

    function changeMode(nextMode: PanelMode, session?: AdminSession | null) {
      setMode(nextMode)
      if (session !== undefined) setSelectedSession(session)
    }

    function afterDelete() {
      setSelectedSession(null)
      setMode('empty')
    }

    const panel = (
      <SessionPanel
        conference={conference}
        sessions={sessions}
        signupCounts={signupCounts}
        checkInCounts={checkInCounts}
        mode={mode}
        selectedSession={selectedSession}
        createDefaultDate={createDefaultDate}
        createNonce={createNonce}
        onModeChange={changeMode}
        onSaved={(id) => setPendingSavedId(id)}
        onAfterDelete={afterDelete}
        onDirtyChange={handlePanelDirtyChange}
      />
    )

    const discardDialog = (
      <Dialog
        open={pendingNav !== null}
        onOpenChange={(open) => !open && setPendingNav(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your edits will be lost. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingNav(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const action = pendingNav
                setPendingNav(null)
                action?.()
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    // Empty conference: just the conference-level empty state (no panel) until
    // the user clicks "Add first" and enters create mode — then render the form
    // full-width since there's nothing to put in the left pane.
    if (sessions.length === 0) {
      return (
        <>
          {mode === 'create' ? (
            <div className="max-w-2xl mx-auto border rounded-lg overflow-hidden min-h-[640px] flex flex-col bg-background">
              {panel}
            </div>
          ) : (
            <div className="py-8">
              <EmptyConferenceState
                onAdd={() => openCreate(conference.start_date)}
              />
            </div>
          )}
          {discardDialog}
        </>
      )
    }

    return (
      <div className="grid grid-cols-2 h-full border-t overflow-hidden">
        <div className="border-r overflow-y-auto bg-muted/40">
          {groupedDays.map(({ date, sessions: daySessions }) => (
            <section key={date} className="pb-4 [&:not(:first-child)]:pt-2">
              <div className="px-6 pt-5 pb-3 sticky top-0 bg-muted/40 backdrop-blur z-10 flex items-baseline gap-2.5">
                <h2 className="text-[13px] font-semibold tracking-tight">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {summarizeDay(daySessions)}
                </span>
              </div>
              <div className="mx-5 flex flex-col gap-1.5">
                {daySessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    timezone={conference.timezone}
                    selected={selectedSession?.id === s.id}
                    signupCount={signupCounts[s.id] ?? 0}
                    checkInCount={checkInCounts[s.id] ?? 0}
                    onSelect={() => attemptNav(() => selectSession(s))}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => openCreate(date)}
                  className="mt-1 rounded-md border border-dashed px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/60 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add on {format(parseISO(date), 'EEEE')}
                </button>
              </div>
            </section>
          ))}
        </div>
        <div className="bg-background flex flex-col">{panel}</div>
        {discardDialog}
      </div>
    )
  }
)

function SessionRow({
  session,
  timezone,
  selected,
  signupCount,
  checkInCount,
  onSelect,
}: {
  session: AdminSession
  timezone: string
  selected: boolean
  signupCount: number
  checkInCount: number
  onSelect: () => void
}) {
  const startWall = formatTime(decomposeTzIso(session.start_at, timezone).time)
  const endWall = formatTime(decomposeTzIso(session.end_at, timezone).time)
  const isFull =
    session.capacity != null && signupCount >= session.capacity

  if (session.is_break) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex items-center min-h-[48px] rounded-lg border border-dashed transition-colors text-left',
          selected
            ? 'bg-muted border-border opacity-100'
            : 'border-border bg-transparent opacity-85 hover:bg-card hover:border-muted-foreground/60'
        )}
      >
        <div className="w-[30px] h-[30px] rounded-full border bg-background ml-4 my-3 flex items-center justify-center text-muted-foreground shrink-0">
          <Coffee className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 px-3.5">
          <div className="text-[13px] font-medium truncate">{session.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {startWall} – {endWall}
            {session.room && ` · ${session.room}`} · break
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-stretch min-h-[60px] rounded-lg border bg-card transition-colors text-left overflow-hidden',
        selected
          ? 'bg-muted border-border'
          : 'border-transparent hover:bg-muted/60 hover:border-border/60'
      )}
    >
      <div className="font-mono text-[11px] text-muted-foreground w-[62px] py-3.5 px-2.5 pl-4 text-right leading-tight flex flex-col justify-center shrink-0">
        <div>{startWall}</div>
        <div className="opacity-70">{endWall}</div>
      </div>
      <div className="w-px bg-border/50 my-2.5" />
      <div className="flex-1 min-w-0 px-3.5 py-3.5 flex flex-col justify-center">
        <div className="text-[13px] font-medium truncate">{session.title}</div>
        {(session.speaker || session.room) && (
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {[session.speaker, session.room].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
      {session.capacity != null && (
        <div className="hidden sm:flex items-center gap-4 px-4 shrink-0">
          <RowStat
            value={`${signupCount}/${session.capacity}`}
            label={isFull ? 'Full' : 'Signed up'}
            tone={isFull ? 'destructive' : 'default'}
          />
          <RowStat
            value={checkInCount === 0 ? '—' : String(checkInCount)}
            label="Checked in"
            tone={checkInCount === 0 ? 'muted' : 'default'}
          />
        </div>
      )}
    </button>
  )
}

// RowStat is local to ScheduleEditor — separate from SessionPanel's Stat
// because the row variant carries a tone for full/muted states.
function RowStat({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone: 'default' | 'destructive' | 'muted'
}) {
  return (
    <div className="text-right">
      <div
        className={cn(
          'text-[13px] font-semibold tabular-nums leading-tight',
          tone === 'destructive' && 'text-destructive',
          tone === 'muted' && 'text-muted-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function EmptyConferenceState({ onAdd }: { onAdd: () => void }) {
  return (
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
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Add first session
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface DayGroup {
  date: string
  sessions: AdminSession[]
}

// Relies on `sessions` being sorted by start_at ascending (data.ts orders it).
// Day keys are sorted defensively; within-day order is preserved from input.
function groupByDay(sessions: AdminSession[], timezone: string): DayGroup[] {
  const map = new Map<string, AdminSession[]>()
  for (const s of sessions) {
    const day = decomposeTzIso(s.start_at, timezone).date
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(s)
  }
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

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
