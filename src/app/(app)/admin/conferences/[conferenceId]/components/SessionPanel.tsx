'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Copy,
  Edit,
  MapPin,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useIsClamped } from '@/hooks/use-is-clamped'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { createSession, deleteSession, updateSession } from '../../client-actions'
import {
  composeSessionIsos,
  dateRangeInclusive,
  decomposeTzIso,
  nextDay,
} from '../../lib/datetime'
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
  // Bumped by the parent on each openCreate so the create-mode FormMode
  // remounts even when consecutive opens reuse the same default date.
  createNonce?: number
  onModeChange: (mode: PanelMode, session?: AdminSession | null) => void
  onSaved: (id: string) => void
  onAfterDelete: () => void
  onDirtyChange: (dirty: boolean) => void
  // Routes a leaving-the-form action through the parent's dirty guard so the
  // Cancel button gets the same discard dialog as row clicks. If omitted,
  // actions run immediately.
  onCancelRequest?: (action: () => void) => void
}

interface FormState {
  isBreak: boolean
  date: string
  startTime: string
  endTime: string
  endsNextDay: boolean
  title: string
  speaker: string
  room: string
  description: string
  capacity: string // string so the input can be empty without becoming 0
  checkInCode: string
}

function emptyForm(defaultDate: string, isBreak: boolean): FormState {
  return {
    isBreak,
    date: defaultDate,
    startTime: '09:00',
    endTime: '10:00',
    endsNextDay: false,
    title: '',
    speaker: '',
    room: '',
    description: '',
    capacity: '',
    checkInCode: '',
  }
}

function fromSession(s: AdminSession, timezone: string): FormState {
  const start = decomposeTzIso(s.start_at, timezone)
  const end = decomposeTzIso(s.end_at, timezone)
  return {
    isBreak: s.is_break,
    date: start.date,
    startTime: start.time,
    endTime: end.time,
    endsNextDay: start.date !== end.date,
    title: s.title,
    speaker: s.speaker ?? '',
    room: s.room ?? '',
    description: s.description ?? '',
    capacity: s.capacity != null ? String(s.capacity) : '',
    checkInCode: s.check_in_code ?? '',
  }
}

export function SessionPanel(props: Props) {
  const { mode } = props
  if (mode === 'empty') return <EmptyState />
  if (mode === 'view' && props.selectedSession) {
    return <ViewMode {...props} session={props.selectedSession} />
  }
  if (mode === 'edit' && props.selectedSession) {
    // key forces remount when target session changes, resetting form state
    // and firing FormMode's cleanup effect (which clears the dirty flag).
    return (
      <FormMode
        key={`edit-${props.selectedSession.id}`}
        {...props}
        session={props.selectedSession}
        isEdit
      />
    )
  }
  if (mode === 'create') {
    // Nonce in the key forces remount on each openCreate, even when the
    // default date doesn't change (e.g., header "Add session" double-click).
    return (
      <FormMode
        key={`create-${props.createNonce ?? 0}`}
        {...props}
        session={null}
        isEdit={false}
      />
    )
  }
  if (mode === 'delete' && props.selectedSession) {
    return <DeleteMode {...props} session={props.selectedSession} />
  }
  return <EmptyState />
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 rounded-full bg-muted/50 p-4">
        <Calendar className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="ym-h3 mb-1">Select a session</h3>
      <p className="max-w-[240px] text-sm leading-relaxed text-muted-foreground">
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
  const [descOpen, setDescOpen] = useState(false)
  const descRef = useRef<HTMLParagraphElement>(null)
  const descClamped = useIsClamped(descRef, [session.id, session.description])
  const { copied, copy, reset: resetCopied } = useCopyToClipboard({
    onSuccess: () => toast.success('Copied'),
    onError: () => toast.error('Could not copy'),
  })

  useEffect(() => {
    setEntries(null)
    setError(null)
    setFilter('all')
    setSearch('')
    setDescOpen(false)
    resetCopied()
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
  }, [session.id, session.is_break, resetCopied])

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
    if (!entries) return { all: 0, in: 0, out: 0, walkIns: 0 }
    let inCount = 0
    let walkIns = 0
    for (const e of entries) {
      if (e.checkedInAt !== null) inCount += 1
      if (e.isWalkIn) walkIns += 1
    }
    return {
      all: entries.length,
      in: inCount,
      out: entries.length - inCount,
      walkIns,
    }
  }, [entries])

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <header className="space-y-2 border-b p-6 pb-5">
          <div className="ym-eyebrow text-primary">
            {session.is_break ? (
              <span className="inline-flex items-center gap-1.5">
                <Coffee className="size-3.5" aria-hidden="true" />
                Break
              </span>
            ) : (
              'Session'
            )}
          </div>
          <h2 className="ym-h2">{session.title}</h2>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(startWall.date), 'EEEE, MMMM d')} ·{' '}
            {formatTime(startWall.time)} – {formatTime(endWall.time)}
          </p>
          {session.room && (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden="true" />
              {session.room}
            </p>
          )}
          {!session.is_break && session.check_in_code && (
            // The screen's one dark block: the code is what staff read out or
            // put on a screen at the door.
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl bg-brand-obsidian p-3 pl-4 text-brand-snow">
                <div>
                  <div className="ym-eyebrow text-brand-snow/70">Check-in code</div>
                  <div className="mt-1 text-2xl font-bold leading-none tracking-[0.2em] tabular-nums">
                    {session.check_in_code}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 bg-white/10 text-brand-snow hover:bg-white/20 hover:text-brand-snow md:h-9"
                  onClick={() => void copy(session.check_in_code ?? '')}
                >
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}
        </header>

        {session.description && (
          <div className="px-6 py-4 text-sm leading-relaxed text-foreground/80 border-b shrink-0">
            <p ref={descRef} className="line-clamp-3 whitespace-pre-wrap">
              {session.description}
            </p>
            {descClamped && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-1 h-auto p-0 text-sm"
                onClick={() => setDescOpen(true)}
              >
                See more
              </Button>
            )}
            <Dialog open={descOpen} onOpenChange={setDescOpen}>
              <DialogContent className="sm:max-w-lg sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="ym-h2">{session.title}</DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {session.description}
                </p>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {!session.is_break && (
          <div className="grid grid-cols-2 gap-3 border-b px-6 py-3">
            <Stat
              label="Signed up"
              value={
                session.capacity != null
                  ? `${signups} / ${session.capacity}`
                  : String(signups)
              }
              hint={
                counts.walkIns > 0
                  ? `+${counts.walkIns} walk-in${counts.walkIns === 1 ? '' : 's'}`
                  : undefined
              }
            />
            <Stat label="Checked in" value={checkIns === 0 ? '—' : String(checkIns)} />
          </div>
        )}

        {!session.is_break ? (
          <>
            <div className="px-6 pt-4 pb-3 border-b space-y-3 shrink-0">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                <TabsList className="h-11 w-full rounded-xl md:h-9">
                  <TabsTrigger value="all" className="h-full flex-1 rounded-lg px-2">
                    All
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {counts.all}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="in" className="h-full flex-1 rounded-lg px-2">
                    Checked in
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {counts.in}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="out" className="h-full flex-1 rounded-lg px-2">
                    Not checked in
                    <span className="ml-1.5 text-muted-foreground tabular-nums">
                      {counts.out}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search attendees..."
                  aria-label="Search attendees"
                  className="h-11 bg-background pl-9 pr-11 md:h-9 md:pr-9"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearch('')}
                    className="absolute right-0.5 top-1/2 size-10 -translate-y-1/2 text-muted-foreground hover:text-foreground md:right-1 md:size-7"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
            </div>

            <div>
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
        ) : null}
      </div>

      <footer className="flex shrink-0 justify-end gap-2 border-t bg-muted/30 px-6 py-3">
        <Button
          variant="ghost"
          onClick={() => onModeChange('delete', session)}
          className="h-11 text-muted-foreground hover:text-destructive md:h-9"
        >
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
        <Button className="h-11 md:h-9" onClick={() => onModeChange('edit', session)}>
          <Edit aria-hidden="true" />
          Edit
        </Button>
      </footer>
    </div>
  )
}

// Submit normalises text fields with .trim(); compare the same way so a
// saved form (server returns trimmed) doesn't show as dirty just because
// the in-memory `form` still holds the user's padded original.
function shallowEqualForm(a: FormState, b: FormState): boolean {
  return (
    a.isBreak === b.isBreak &&
    a.date === b.date &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.title.trim() === b.title.trim() &&
    a.speaker.trim() === b.speaker.trim() &&
    a.room.trim() === b.room.trim() &&
    a.description.trim() === b.description.trim() &&
    a.capacity.trim() === b.capacity.trim() &&
    a.checkInCode.trim() === b.checkInCode.trim()
  )
}

function FormMode({
  conference,
  session,
  sessions,
  createDefaultDate,
  isEdit,
  onModeChange,
  onSaved,
  onDirtyChange,
  onCancelRequest,
}: Props & { session: AdminSession | null; isEdit: boolean }) {
  const router = useRouter()

  const conferenceDays = useMemo(
    () => dateRangeInclusive(conference.start_date, conference.end_date),
    [conference.start_date, conference.end_date]
  )
  const initialForm = useMemo<FormState>(() => {
    if (session) return fromSession(session, conference.timezone)
    const fallbackDate =
      createDefaultDate ?? conferenceDays[0] ?? conference.start_date
    return emptyForm(fallbackDate, false)
  }, [
    session,
    conference.timezone,
    conferenceDays,
    conference.start_date,
    createDefaultDate,
  ])

  const [form, setForm] = useState<FormState>(initialForm)
  const [pending, setPending] = useState(false)
  const [touched, setTouched] = useState<Set<string>>(() => new Set())
  const [attempted, setAttempted] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  // Auto-focus title on create only — edit mode would steal focus from the
  // user scanning existing values.
  useEffect(() => {
    if (!isEdit) titleRef.current?.focus()
  }, [isEdit])

  // Track dirty state and report to parent so it can guard navigation away
  // from an unsaved form (see ScheduleEditor's attemptNav).
  const isDirty = useMemo(
    () => !shallowEqualForm(form, initialForm),
    [form, initialForm]
  )
  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])
  // On unmount, always clear — prevents a stale "dirty" flag after the form
  // is replaced (save success, key-driven remount, etc.).
  useEffect(() => {
    return () => onDirtyChange(false)
  }, [onDirtyChange])

  // rAF defers past Radix mount animation so scrollHeight is accurate
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = descRef.current
      if (!el) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
    return () => cancelAnimationFrame(raf)
  }, [form.description])

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function touch(key: string) {
    setTouched((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  const titleOk = form.title.trim().length > 0
  const dateOk = conferenceDays.includes(form.date)
  // When "Ends next day" is on, the end wall clock lands on date+1 — that day
  // must also be a valid conference day.
  const endDateOk = !form.endsNextDay || conferenceDays.includes(nextDay(form.date))
  const startFmtOk = /^\d{2}:\d{2}$/.test(form.startTime)
  const endFmtOk = /^\d{2}:\d{2}$/.test(form.endTime)
  // Two branches: same-day sessions need end > start; midnight-cross needs any
  // non-equal end (equal would be a 24-hour block).
  const endTimeOk =
    endFmtOk &&
    startFmtOk &&
    (form.endsNextDay
      ? form.endTime !== form.startTime
      : form.endTime > form.startTime)
  const capacityOk =
    form.capacity === '' ||
    (/^\d+$/.test(form.capacity.trim()) && Number(form.capacity) > 0)
  const canSubmit =
    titleOk && dateOk && endDateOk && startFmtOk && endTimeOk && capacityOk

  function showErr(key: string, ok: boolean): boolean {
    return !ok && (attempted || touched.has(key))
  }

  // Non-blocking room conflict warning. Case-insensitive exact match.
  const sessionId = session?.id ?? null
  const roomConflict: AdminSession | null = useMemo(() => {
    if (!form.room.trim()) return null
    if (!endTimeOk) return null
    // Compare as numeric ms — Postgres returns TIMESTAMPTZ as "…+00:00" while
    // composeTzIso emits "…Z", so lexicographic compare would treat the same
    // instant as different and flag spurious conflicts.
    const { startIso, endIso } = composeSessionIsos(
      form.date,
      form.startTime,
      form.endTime,
      conference.timezone,
      form.endsNextDay
    )
    const startMs = Date.parse(startIso)
    const endMs = Date.parse(endIso)
    const roomLower = form.room.trim().toLowerCase()
    return (
      sessions.find(
        (s) =>
          s.id !== (sessionId ?? '') &&
          !s.is_break &&
          s.room != null &&
          s.room.trim().toLowerCase() === roomLower &&
          Date.parse(s.start_at) < endMs &&
          Date.parse(s.end_at) > startMs
      ) ?? null
    )
  }, [
    form.room,
    form.date,
    form.startTime,
    form.endTime,
    form.endsNextDay,
    conference.timezone,
    sessionId,
    sessions,
    endTimeOk,
  ])

  async function handleSubmit() {
    if (!canSubmit) {
      setAttempted(true)
      return
    }
    if (pending) return
    setPending(true)
    try {
      const { startIso, endIso } = composeSessionIsos(
        form.date,
        form.startTime,
        form.endTime,
        conference.timezone,
        form.endsNextDay
      )
      const payload = {
        conference_id: conference.id,
        start_at: startIso,
        end_at: endIso,
        title: form.title.trim(),
        description: form.description.trim() || null,
        speaker: form.isBreak ? null : form.speaker.trim() || null,
        room: form.room.trim() || null,
        is_break: form.isBreak,
        capacity:
          form.isBreak || form.capacity.trim() === ''
            ? null
            : Number(form.capacity),
        check_in_code: form.isBreak ? null : form.checkInCode.trim() || null,
      }

      const result = isEdit
        ? await updateSession(session!.id, payload)
        : await createSession(payload)

      if (!result.success) {
        toast.error(result.error ?? 'Could not save session')
        return
      }
      toast.success(
        isEdit
          ? form.isBreak
            ? 'Break updated'
            : 'Session updated'
          : form.isBreak
          ? 'Break added'
          : 'Session added'
      )
      const savedId = isEdit
        ? session!.id
        : (result as { success: true; id: string }).id
      onSaved(savedId)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  function handleCancel() {
    const exit = () => {
      if (isEdit && session) onModeChange('view', session)
      else onModeChange('empty', null)
    }
    // Route through the parent's dirty guard so unsaved edits get the same
    // discard dialog as row clicks / tab switches. Falls back to immediate
    // exit if no guard was wired.
    if (onCancelRequest) onCancelRequest(exit)
    else exit()
  }

  const heading = isEdit
    ? form.isBreak
      ? 'Edit break'
      : 'Edit session'
    : form.isBreak
    ? 'New break'
    : 'New session'
  const submitLabel = isEdit
    ? 'Save changes'
    : form.isBreak
    ? 'Add break'
    : 'Add session'

  return (
    <div className="flex flex-col h-full">
      <header className="border-b p-6 pb-5">
        <h2 className="ym-h2">{heading}</h2>
        {dateOk && (
          <p className="text-sm text-muted-foreground mt-1">
            {format(parseISO(form.date), 'EEEE, MMMM d')}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
        <ModeToggle
          isBreak={form.isBreak}
          onToggle={() => field('isBreak', !form.isBreak)}
        />

        <div>
          <Label>Day</Label>
          <Select value={form.date} onValueChange={(v) => field('date', v)}>
            <SelectTrigger
              className={cn(
                'mt-1.5 h-11 md:h-9',
                !dateOk && 'border-destructive focus-visible:ring-destructive'
              )}
            >
              <SelectValue placeholder="Pick a day" />
            </SelectTrigger>
            <SelectContent>
              {conferenceDays.map((d) => (
                <SelectItem key={d} value={d}>
                  {format(parseISO(d), 'EEEE, MMMM d')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!dateOk && (
            <p className="text-xs text-destructive mt-1">
              Pick a day within the conference dates.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sp-start">
              Start
            </Label>
            <Input
              id="sp-start"
              type="time"
              value={form.startTime}
              onChange={(e) => field('startTime', e.target.value)}
              onBlur={() => touch('startTime')}
              className={cn(
                'mt-1.5 h-11 font-mono md:h-9',
                showErr('startTime', startFmtOk) &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {showErr('startTime', startFmtOk) && (
              <p className="text-xs text-destructive mt-1">
                Enter a valid start time.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="sp-end">
              End
            </Label>
            <Input
              id="sp-end"
              type="time"
              value={form.endTime}
              onChange={(e) => field('endTime', e.target.value)}
              onBlur={() => touch('endTime')}
              className={cn(
                'mt-1.5 h-11 font-mono md:h-9',
                showErr('endTime', endTimeOk) &&
                  'border-destructive focus-visible:ring-destructive'
              )}
            />
            {showErr('endTime', endTimeOk) && (
              <p className="text-xs text-destructive mt-1">
                {form.endsNextDay
                  ? 'End time cannot equal start time.'
                  : 'End must be after start.'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="inline-flex min-h-11 cursor-pointer select-none items-center gap-2">
            <Checkbox
              checked={form.endsNextDay}
              onCheckedChange={(v) => field('endsNextDay', v === true)}
            />
            <span className="text-sm">Ends next day</span>
          </label>
          {form.endsNextDay && !endDateOk && (
            <p className="text-xs text-destructive">
              The next day is outside the conference dates.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="sp-title">
            Title
          </Label>
          <Input
            id="sp-title"
            ref={titleRef}
            value={form.title}
            onChange={(e) => field('title', e.target.value)}
            onBlur={() => touch('title')}
            placeholder={
              form.isBreak
                ? 'Coffee & Conversation'
                : 'The Ethics of Community Building'
            }
            className={cn(
              'mt-1.5 h-11 md:h-9',
              showErr('title', titleOk) &&
                'border-destructive focus-visible:ring-destructive'
            )}
          />
          {showErr('title', titleOk) && (
            <p className="text-xs text-destructive mt-1">Title is required.</p>
          )}
        </div>

        {!form.isBreak && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-speaker">
                Speaker
              </Label>
              <Input
                id="sp-speaker"
                value={form.speaker}
                onChange={(e) => field('speaker', e.target.value)}
                placeholder="Dr. Sameer Ansari"
                className="mt-1.5 h-11 md:h-9"
              />
            </div>
            <div>
              <Label htmlFor="sp-room">
                Room
              </Label>
              <Input
                id="sp-room"
                value={form.room}
                onChange={(e) => field('room', e.target.value)}
                placeholder="Ballroom A"
                className="mt-1.5 h-11 md:h-9"
              />
              {roomConflict && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Overlaps with &ldquo;{roomConflict.title}&rdquo; in this room.
                </p>
              )}
            </div>
          </div>
        )}

        {form.isBreak && (
          <div>
            <Label htmlFor="sp-room-break">
              Location{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="sp-room-break"
              value={form.room}
              onChange={(e) => field('room', e.target.value)}
              placeholder="Mezzanine Foyer"
              className="mt-1.5 h-11 md:h-9"
            />
          </div>
        )}

        <div>
          <Label htmlFor="sp-description">
            Description{' '}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Textarea
            ref={descRef}
            id="sp-description"
            value={form.description}
            onChange={(e) => field('description', e.target.value)}
            className="mt-1.5 resize-none overflow-hidden"
            style={{ minHeight: '4rem' }}
          />
        </div>

        {!form.isBreak && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sp-capacity">
                Capacity{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="sp-capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => field('capacity', e.target.value)}
                onBlur={() => touch('capacity')}
                placeholder="80"
                className={cn(
                  'mt-1.5 h-11 tabular-nums md:h-9',
                  showErr('capacity', capacityOk) &&
                    'border-destructive focus-visible:ring-destructive'
                )}
              />
              {showErr('capacity', capacityOk) && (
                <p className="text-xs text-destructive mt-1">
                  Must be a whole number greater than 0.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="sp-code">
                Check-in code{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="sp-code"
                value={form.checkInCode}
                onChange={(e) =>
                  field('checkInCode', e.target.value.slice(0, 15))
                }
                placeholder="e.g. GATE, 7291"
                className="mt-1.5 h-11 font-mono tracking-widest md:h-9"
              />
              {form.checkInCode.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1 text-right tabular-nums">
                  {form.checkInCode.length}/15
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
        <Button variant="ghost" className="h-11 md:h-9" disabled={pending} onClick={handleCancel}>
          Cancel
        </Button>
        <Button className="h-11 md:h-9" onClick={handleSubmit} disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </footer>
    </div>
  )
}

function DeleteMode({
  session,
  signupCounts,
  checkInCounts,
  onModeChange,
  onAfterDelete,
}: Props & { session: AdminSession }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const enabled = confirm.trim().toLowerCase() === 'delete' && !pending
  const signups = signupCounts[session.id] ?? 0
  const checkIns = checkInCounts[session.id] ?? 0

  async function handleDelete() {
    if (!enabled) return
    setPending(true)
    try {
      const result = await deleteSession(session.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not delete')
        return
      }
      toast.success(session.is_break ? 'Break deleted' : 'Session deleted')
      onAfterDelete()
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="border-b p-6 pb-5">
        <div className="ym-eyebrow mb-2 text-destructive">Confirm delete</div>
        <h2 className="ym-h2">
          {session.is_break ? 'Delete this break?' : 'Delete this session?'}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Permanently removes{' '}
          <span className="text-foreground font-medium">
            &ldquo;{session.title}&rdquo;
          </span>
          {!session.is_break && (signups > 0 || checkIns > 0) && (
            <>
              {' '}and {signups} signup{signups === 1 ? '' : 's'}
              {checkIns > 0 && (
                <>
                  , {checkIns} check-in{checkIns === 1 ? '' : 's'}
                </>
              )}
            </>
          )}
          . This cannot be undone.
        </p>
      </header>
      <div className="px-6 py-4 flex-1">
        <Label htmlFor="sp-confirm-delete">
          Type <span className="font-mono">delete</span> to confirm
        </Label>
        <Input
          id="sp-confirm-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-label="Type delete to confirm"
          className="mt-1.5 h-11 font-mono md:h-9"
          autoFocus
        />
      </div>
      <footer className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
        <Button
          variant="ghost"
          className="h-11 md:h-9"
          disabled={pending}
          onClick={() => onModeChange('view', session)}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="h-11 md:h-9"
          disabled={!enabled}
          onClick={handleDelete}
        >
          {pending
            ? 'Deleting…'
            : session.is_break
            ? 'Delete break'
            : 'Delete session'}
        </Button>
      </footer>
    </div>
  )
}

function ModeToggle({
  isBreak,
  onToggle,
}: {
  isBreak: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-muted/40 p-3">
      <div className="rounded-full bg-muted p-2">
        {isBreak ? (
          <Coffee className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{isBreak ? 'Break' : 'Session'}</p>
        <p className="text-sm text-muted-foreground">
          {isBreak
            ? 'Information only — no signup or capacity'
            : 'Attendees can sign up and check in'}
        </p>
      </div>
      <Button variant="ghost" className="h-11 shrink-0 md:h-9" onClick={onToggle} type="button">
        {isBreak ? 'Make session' : 'Make break'}
      </Button>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl bg-secondary px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">
        {value}
        {hint && (
          <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
            {hint}
          </span>
        )}
      </div>
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
    <li className="flex min-h-14 items-center gap-3 px-6 py-3">
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold">{entry.name}</div>
        {checkedIn && entry.checkedInAt && (
          <div className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Checked in at{' '}
            {formatTime(decomposeTzIso(entry.checkedInAt, timezone).time)}
          </div>
        )}
      </div>
      {checkedIn ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Checked in
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
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
    <div className="mx-auto max-w-xs px-6 py-12 text-center">
      <div className="mx-auto mb-4 w-fit rounded-full bg-muted/50 p-4">
        <Users className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="ym-h3 mb-1">Nobody signed up yet</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
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
