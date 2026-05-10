'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coffee, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { createSession, updateSession } from '../../client-actions'
import {
  composeTzIso,
  dateRangeInclusive,
  decomposeTzIso,
} from '../../lib/datetime'
import type { AdminSession, Conference } from '../../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  conference: Conference
  // null = creating a new session, otherwise editing an existing one.
  session: AdminSession | null
  // Pre-select day for new sessions (defaults to first conf day).
  defaultDate?: string
}

interface FormState {
  isBreak: boolean
  date: string
  startTime: string
  endTime: string
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
    title: s.title,
    speaker: s.speaker ?? '',
    room: s.room ?? '',
    description: s.description ?? '',
    capacity: s.capacity != null ? String(s.capacity) : '',
    checkInCode: s.check_in_code ?? '',
  }
}

export function SessionEditor({
  open,
  onOpenChange,
  conference,
  session,
  defaultDate,
}: Props) {
  const router = useRouter()
  const isEdit = session !== null
  const conferenceDays = useMemo(
    () => dateRangeInclusive(conference.start_date, conference.end_date),
    [conference.start_date, conference.end_date]
  )
  const initialForm = useMemo<FormState>(() => {
    if (session) return fromSession(session, conference.timezone)
    const fallbackDate = defaultDate ?? conferenceDays[0] ?? conference.start_date
    return emptyForm(fallbackDate, false)
  }, [session, conference.timezone, conferenceDays, conference.start_date, defaultDate])

  const [form, setForm] = useState<FormState>(initialForm)
  const [pending, setPending] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [form.description, open])

  // Reset whenever the dialog opens with a different target. Prevents a stale
  // form from previous open carrying into the next add/edit click.
  useEffect(() => {
    if (open) setForm(initialForm)
  }, [open, initialForm])

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Field validation. Times must be HH:mm and end > start by clock; the DB
  // CHECK constraint backstops if we miss something here.
  const titleOk = form.title.trim().length > 0
  const dateOk = conferenceDays.includes(form.date)
  const timesOk =
    /^\d{2}:\d{2}$/.test(form.startTime) &&
    /^\d{2}:\d{2}$/.test(form.endTime) &&
    form.endTime > form.startTime
  const capacityOk =
    form.capacity === '' ||
    (/^\d+$/.test(form.capacity.trim()) && Number(form.capacity) > 0)
  const canSubmit = titleOk && dateOk && timesOk && capacityOk

  async function handleSubmit() {
    if (!canSubmit || pending) return
    setPending(true)
    try {
      const startIso = composeTzIso(form.date, form.startTime, conference.timezone)
      const endIso = composeTzIso(form.date, form.endTime, conference.timezone)
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
      onOpenChange(false)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const dialogTitle = isEdit
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-[520px] p-0">
        <DialogHeader className="p-6 pb-4 border-b text-left">
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dateOk && (
            <p className="text-sm text-muted-foreground mt-1">
              {format(parseISO(form.date), 'EEEE, MMMM d')}
            </p>
          )}
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <ModeToggle
            isBreak={form.isBreak}
            onToggle={() => field('isBreak', !form.isBreak)}
          />

          <div>
            <Label className="text-xs">Day</Label>
            <Select value={form.date} onValueChange={(v) => field('date', v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conferenceDays.map((d) => (
                  <SelectItem key={d} value={d}>
                    {format(parseISO(d), 'EEEE, MMMM d')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="se-start" className="text-xs">
                Start
              </Label>
              <Input
                id="se-start"
                type="time"
                value={form.startTime}
                onChange={(e) => field('startTime', e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="se-end" className="text-xs">
                End
              </Label>
              <Input
                id="se-end"
                type="time"
                value={form.endTime}
                onChange={(e) => field('endTime', e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="se-title" className="text-xs">
              Title
            </Label>
            <Input
              id="se-title"
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
              placeholder={
                form.isBreak ? 'Coffee & Conversation' : 'The Ethics of Community Building'
              }
              className="mt-1"
            />
          </div>

          {!form.isBreak && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="se-speaker" className="text-xs">
                  Speaker
                </Label>
                <Input
                  id="se-speaker"
                  value={form.speaker}
                  onChange={(e) => field('speaker', e.target.value)}
                  placeholder="Dr. Sameer Ansari"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="se-room" className="text-xs">
                  Room
                </Label>
                <Input
                  id="se-room"
                  value={form.room}
                  onChange={(e) => field('room', e.target.value)}
                  placeholder="Ballroom A"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {form.isBreak && (
            <div>
              <Label htmlFor="se-room-break" className="text-xs">
                Location{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="se-room-break"
                value={form.room}
                onChange={(e) => field('room', e.target.value)}
                placeholder="Mezzanine Foyer"
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="se-description" className="text-xs">
              Description{' '}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              ref={descRef}
              id="se-description"
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              className="mt-1 resize-none overflow-hidden"
              style={{ minHeight: '4rem' }}
            />
          </div>

          {!form.isBreak && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="se-capacity" className="text-xs">
                  Capacity{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="se-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => field('capacity', e.target.value)}
                  placeholder="80"
                  className="mt-1 tabular-nums"
                />
              </div>
              <div>
                <Label htmlFor="se-code" className="text-xs">
                  Check-in code{' '}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="se-code"
                  value={form.checkInCode}
                  onChange={(e) => field('checkInCode', e.target.value)}
                  placeholder="4-digit code"
                  className="mt-1 font-mono tracking-widest"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2 sm:gap-2">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || pending}>
            {pending ? 'Saving…' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="rounded-lg border bg-muted/40 p-3 flex items-center gap-3">
      <div className="rounded-full bg-muted p-2">
        {isBreak ? (
          <Coffee className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Users className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{isBreak ? 'Break' : 'Session'}</p>
        <p className="text-xs text-muted-foreground">
          {isBreak
            ? 'Information only — no signup or capacity'
            : 'Attendees can sign up and check in'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onToggle} type="button">
        {isBreak ? 'Make session' : 'Make break'}
      </Button>
    </div>
  )
}
