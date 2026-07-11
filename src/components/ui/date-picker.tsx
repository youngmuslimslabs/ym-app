'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import * as React from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Round-trip DATE columns (YYYY-MM-DD) through Date objects without timezone
// drift. Native `new Date('2026-04-26')` parses as UTC midnight, which then
// renders as the previous calendar day in negative-UTC timezones. These helpers
// stay anchored to the wall-clock date.
export function parseDateInput(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function toDateInputString(d: Date | undefined): string {
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Props {
  // Forwarded to the trigger so a sibling <Label htmlFor> focuses the picker.
  id?: string
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  // Used to constrain the year-dropdown range. Defaults span 1940 → 10 years
  // out, which fits both the onboarding DOB picker and conference scheduling.
  fromYear?: number
  toYear?: number
  // Restrict selectable dates (e.g., end_date >= start_date).
  fromDate?: Date
  toDate?: Date
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  fromYear = 1940,
  toYear = new Date().getFullYear() + 10,
  fromDate,
  toDate,
  className,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  // Closing on select is a no-op for the uncontrolled desktop Popover (it ignores
  // `open`) but dismisses the controlled mobile Dialog — so desktop behavior is
  // unchanged while mobile closes the modal once a day is picked.
  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        'w-full justify-start text-left font-normal',
        !value && 'text-muted-foreground',
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, 'PPP') : placeholder}
    </Button>
  )

  const calendar = (
    <Calendar
      mode="single"
      selected={value}
      onSelect={handleSelect}
      initialFocus
      captionLayout="dropdown"
      fromYear={fromYear}
      toYear={toYear}
      disabled={
        fromDate || toDate
          ? (date) =>
              (fromDate ? date < fromDate : false) ||
              (toDate ? date > toDate : false)
          : undefined
      }
    />
  )

  // Mobile: a centered modal. Decoupling from the trigger avoids the Radix
  // collision math that clips anchored calendars off the bottom/side of small
  // viewports (issue #51); max-width keeps it inside a 329px screen.
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="w-auto max-w-[calc(100vw-2rem)] justify-items-center p-4"
        >
          <DialogTitle className="sr-only">{placeholder}</DialogTitle>
          {calendar}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {calendar}
      </PopoverContent>
    </Popover>
  )
}
