'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
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
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
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
      </PopoverContent>
    </Popover>
  )
}
