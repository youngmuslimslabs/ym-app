"use client"

import * as React from "react"

import { MonthYearPicker } from "@/components/month-year-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DateRangeInputProps {
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent: boolean
  onChange: (values: {
    startMonth?: number
    startYear?: number
    endMonth?: number
    endYear?: number
    isCurrent: boolean
  }) => void
  currentLabel?: string
  disabled?: boolean
}

export function DateRangeInput({
  startMonth,
  startYear,
  endMonth,
  endYear,
  isCurrent,
  onChange,
  currentLabel = "I currently hold this role",
  disabled = false,
}: DateRangeInputProps) {
  // Generate unique ID to avoid duplicate IDs when multiple instances render
  const checkboxId = React.useId()
  // Roles and projects are historical: a start or end date can't be in the
  // future, so cap the selectable year at the current year. (Prevents e.g. a
  // "current" role that starts in 2030.)
  const maxYear = new Date().getFullYear()
  const handleStartMonthChange = (month: number) => {
    onChange({ startMonth: month, startYear, endMonth, endYear, isCurrent })
  }

  const handleStartYearChange = (year: number) => {
    onChange({ startMonth, startYear: year, endMonth, endYear, isCurrent })
  }

  const handleEndMonthChange = (month: number) => {
    onChange({ startMonth, startYear, endMonth: month, endYear, isCurrent })
  }

  const handleEndYearChange = (year: number) => {
    onChange({ startMonth, startYear, endMonth, endYear: year, isCurrent })
  }

  const handleCurrentChange = (checked: boolean) => {
    onChange({
      startMonth,
      startYear,
      endMonth: checked ? undefined : endMonth,
      endYear: checked ? undefined : endYear,
      isCurrent: checked,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <MonthYearPicker
            month={startMonth}
            year={startYear}
            onMonthChange={handleStartMonthChange}
            onYearChange={handleStartYearChange}
            maxYear={maxYear}
            disabled={disabled}
          />
        </div>
        {!isCurrent && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End</Label>
            <MonthYearPicker
              month={endMonth}
              year={endYear}
              onMonthChange={handleEndMonthChange}
              onYearChange={handleEndYearChange}
              maxYear={maxYear}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={checkboxId}
          checked={isCurrent}
          onCheckedChange={handleCurrentChange}
          disabled={disabled}
        />
        <Label
          htmlFor={checkboxId}
          className="text-sm font-normal cursor-pointer"
        >
          {currentLabel}
        </Label>
      </div>
    </div>
  )
}
