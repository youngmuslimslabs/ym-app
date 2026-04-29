'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DatePicker, toDateInputString } from '@/components/ui/date-picker'
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
import { TIMEZONE_OPTIONS } from '../lib/timezones'
import { createConference } from '../actions'

const DEFAULT_TZ = 'America/New_York'

export function ConferenceCreateDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [timezone, setTimezone] = useState(DEFAULT_TZ)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')

  function reset() {
    setName('')
    setTagline('')
    setStartDate(undefined)
    setEndDate(undefined)
    setTimezone(DEFAULT_TZ)
    setLocation('')
    setDescription('')
  }

  // The "Create" button is disabled until the minimum required fields are
  // valid — this matches the prototype's affordance and saves the user a
  // round-trip to find out something is missing.
  const datesValid =
    !!startDate && !!endDate && endDate.getTime() >= startDate.getTime()
  const canCreate = name.trim().length > 0 && datesValid

  async function handleCreate() {
    if (!canCreate || pending || !startDate || !endDate) return
    setPending(true)
    try {
      const result = await createConference({
        name: name.trim(),
        tagline: tagline.trim() || null,
        start_date: toDateInputString(startDate),
        end_date: toDateInputString(endDate),
        timezone,
        location: location.trim() || null,
        description: description.trim() || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Conference created')
      reset()
      setOpen(false)
      router.push(`/admin/conferences/${result.id}`)
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" />
          New conference
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New conference</DialogTitle>
          <DialogDescription>
            Just the essentials to get started. You can edit everything else
            after.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="conf-name">Name</Label>
            <Input
              id="conf-name"
              autoFocus
              placeholder="National Convention 2027"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="conf-tagline">
              Tagline{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="conf-tagline"
              placeholder="Building together, believing together"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="conf-start-date">Start date</Label>
              <DatePicker
                id="conf-start-date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select date"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="conf-end-date">End date</Label>
              <DatePicker
                id="conf-end-date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select date"
                fromDate={startDate}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
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
          <div>
            <Label htmlFor="conf-location">
              Location{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="conf-location"
              placeholder="Chicago Hilton"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="conf-description">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="conf-description"
              rows={2}
              placeholder="Short blurb attendees see at the top of the schedule…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canCreate || pending} onClick={handleCreate}>
            {pending ? 'Creating…' : 'Create conference'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
