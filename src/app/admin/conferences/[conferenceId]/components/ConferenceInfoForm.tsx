'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
import { FloatingSaveBar } from '@/components/ui/floating-save-bar'
import { TIMEZONE_OPTIONS } from '../../lib/timezones'
import { updateConference } from '../../actions'
import type { Conference } from '../../types'

interface Props {
  conference: Conference
  onDeleteClick: () => void
}

interface FormState {
  name: string
  tagline: string
  start_date: string
  end_date: string
  timezone: string
  location: string
  description: string
}

function toFormState(c: Conference): FormState {
  return {
    name: c.name,
    tagline: c.tagline ?? '',
    start_date: c.start_date,
    end_date: c.end_date,
    timezone: c.timezone,
    location: c.location ?? '',
    description: c.description ?? '',
  }
}

export function ConferenceInfoForm({ conference, onDeleteClick }: Props) {
  const router = useRouter()
  const [initial, setInitial] = useState<FormState>(() => toFormState(conference))
  const [form, setForm] = useState<FormState>(() => toFormState(conference))

  // FloatingSaveBar shows whenever the dirty count is > 0 — counted per
  // field rather than as a single boolean so we can put a useful "N changes"
  // label on the save bar and match the design-system convention used in
  // profile editing.
  const changeCount = useMemo(() => {
    let n = 0
    for (const key of Object.keys(form) as (keyof FormState)[]) {
      if (form[key] !== initial[key]) n += 1
    }
    return n
  }, [form, initial])

  const valid =
    form.name.trim().length > 0 &&
    form.start_date.length === 10 &&
    form.end_date.length === 10 &&
    form.end_date >= form.start_date

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!valid) {
      toast.error('Fix the highlighted fields before saving')
      throw new Error('invalid')
    }
    const result = await updateConference(conference.id, {
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      timezone: form.timezone,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    })
    if (!result.success) {
      toast.error(result.error ?? 'Could not save')
      throw new Error(result.error ?? 'save-failed')
    }
    setInitial(form)
    router.refresh()
  }

  return (
    <div className="max-w-3xl space-y-6 pb-24">
      <div>
        <Label htmlFor="info-name">Name</Label>
        <Input
          id="info-name"
          value={form.name}
          onChange={(e) => field('name', e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="info-tagline">
          Tagline{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="info-tagline"
          value={form.tagline}
          onChange={(e) => field('tagline', e.target.value)}
          placeholder="Building together, believing together"
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="info-start">Start date</Label>
          <Input
            id="info-start"
            type="date"
            value={form.start_date}
            onChange={(e) => field('start_date', e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="info-end">End date</Label>
          <Input
            id="info-end"
            type="date"
            min={form.start_date || undefined}
            value={form.end_date}
            onChange={(e) => field('end_date', e.target.value)}
            className="mt-1.5"
          />
        </div>
      </div>
      <div className="max-w-md">
        <Label>Timezone</Label>
        <Select
          value={form.timezone}
          onValueChange={(value) => field('timezone', value)}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="max-w-md">
        <Label htmlFor="info-location">
          Location{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="info-location"
          value={form.location}
          onChange={(e) => field('location', e.target.value)}
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="info-description">
          Description{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="info-description"
          rows={3}
          value={form.description}
          onChange={(e) => field('description', e.target.value)}
          className="mt-1.5 resize-none"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-2 text-destructive">
          Danger zone
        </h3>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Delete this conference</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Removes all sessions, signups, check-ins, and feedback. Cannot be
              undone.
            </p>
          </div>
          <Button variant="destructive" onClick={onDeleteClick}>
            Delete
          </Button>
        </div>
      </div>

      <FloatingSaveBar
        hasChanges={changeCount > 0}
        changeCount={changeCount}
        onSave={handleSave}
        successMessage="Saved"
      />
    </div>
  )
}
