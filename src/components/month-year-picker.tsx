"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MONTHS = [
  { value: "1", label: "Jan" },
  { value: "2", label: "Feb" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Apr" },
  { value: "5", label: "May" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Aug" },
  { value: "9", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
]

interface MonthYearPickerProps {
  month?: number
  year?: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  minYear?: number
  maxYear?: number
  disabled?: boolean
}

export function MonthYearPicker({
  month,
  year,
  onMonthChange,
  onYearChange,
  minYear = 1980,
  maxYear = new Date().getFullYear() + 5,
  disabled = false,
}: MonthYearPickerProps) {
  // Generate year options
  const years = React.useMemo(() => {
    const result = []
    for (let y = maxYear; y >= minYear; y--) {
      result.push({ value: y.toString(), label: y.toString() })
    }
    return result
  }, [minYear, maxYear])

  return (
    <div className="flex gap-2">
      <Select
        value={month?.toString()}
        onValueChange={(val) => onMonthChange(parseInt(val, 10))}
        disabled={disabled}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year?.toString()}
        onValueChange={(val) => onYearChange(parseInt(val, 10))}
        disabled={disabled}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y.value} value={y.value}>
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
