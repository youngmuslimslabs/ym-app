'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { SearchableCombobox, type ComboboxValue } from '@/components/searchable-combobox'
import { cn } from '@/lib/utils'

function StepHeader({ label, help }: { label: string; help?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-balance">{label}</h1>
      {help && <p className="mt-2 text-sm text-muted-foreground">{help}</p>}
    </div>
  )
}

interface TextStepProps {
  label: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  type?: 'text' | 'tel' | 'email'
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  autoComplete?: string
  placeholder?: string
  help?: string
  ctaLabel?: string
  // Reuse the proven field logic from `@/lib/validation` (same functions the
  // profile editor uses) — the caller passes them in, this component never
  // reinvents formatting/validation.
  format?: (value: string) => string
  validate?: (value: string) => boolean
  errorMessage?: string
}

/** Typeform text field: type, then Enter/Continue advances. Never on keystroke. */
export function TextStep({
  label,
  value,
  onChange,
  onNext,
  type = 'text',
  inputMode,
  autoComplete,
  placeholder,
  help,
  ctaLabel = 'Continue',
  format,
  validate,
  errorMessage,
}: TextStepProps) {
  const [touched, setTouched] = useState(false)
  // With a validator, advance only when VALID; otherwise fall back to non-empty.
  const canAdvance = validate ? validate(value) : value.trim().length > 0
  // Show the error only after the field is touched (blurred) and the entered,
  // non-empty value fails validation — the original onboarding's `touched` pattern.
  const showError = touched && value.trim().length > 0 && !!validate && !validate(value)

  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <div className="flex flex-col gap-1.5">
        <Input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          autoFocus
          aria-invalid={showError}
          onChange={(e) => onChange(format ? format(e.target.value) : e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAdvance) {
              e.preventDefault()
              onNext()
            }
          }}
          className={cn(
            'h-14 text-base',
            showError && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {showError && errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground">press Enter ↵</span>
        <Button onClick={onNext} disabled={!canAdvance} className="min-w-32">
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectStepProps {
  label: string
  options: SelectOption[]
  onSelect: (value: string) => void
  onNext: () => void
  value?: string
  placeholder?: string
  help?: string
}

/**
 * Typeform single choice on the proven shadcn <Select>. Picking an option fires
 * onSelect (the flow sets the answer and auto-advances). The Continue button is
 * the forward affordance when a value is already set — e.g. after navigating Back
 * to an answered screen, where no new selection fires.
 * NOTE (roadmap): later upgrade to full-width tappable tiles + search-at-top /
 * the Nationality soft-suggestion combobox — see docs/project-todos.md.
 */
export function SelectStep({
  label,
  options,
  onSelect,
  onNext,
  value,
  placeholder = 'Select an option',
  help,
}: SelectStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <Select value={value || undefined} onValueChange={onSelect}>
        <SelectTrigger className="h-14 text-base">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!value} className="min-w-32">
          Continue
        </Button>
      </div>
    </div>
  )
}

interface ComboboxStepProps {
  label: string
  options: SelectOption[]
  onSelect: (value: string) => void
  onNext: () => void
  value?: string
  placeholder?: string
  searchPlaceholder?: string
  /** Allow a typed-in value not in the list (soft-suggestion). */
  allowCustom?: boolean
  help?: string
}

/**
 * Typeform single choice on the proven `SearchableCombobox` (searchable, with an
 * optional free-text "add your own"). Picking/adding fires onSelect with the plain
 * string (the flow sets the answer and auto-advances). The component speaks its own
 * `{ type, value }` shape; we adapt string ↔ that shape here so the flow stays uniform.
 */
export function ComboboxStep({
  label,
  options,
  onSelect,
  onNext,
  value,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search…',
  allowCustom = false,
  help,
}: ComboboxStepProps) {
  const comboValue: ComboboxValue | undefined = value
    ? options.some((o) => o.value === value)
      ? { type: 'existing', value, label: options.find((o) => o.value === value)?.label }
      : { type: 'custom', value }
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <SearchableCombobox
        options={options}
        value={comboValue}
        onChange={(v) => v && onSelect(v.value)}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        allowCustom={allowCustom}
        className="h-14 text-base"
        // Onboarding pickers are bounded reference lists (nationalities ~191,
        // NeighborNets ~118) that fit in the scrollable popover. Show them all —
        // the default 50-item cap would truncate the un-searched list (e.g.
        // nationalities cut off at "D") and force users to type to find the rest.
        maxDisplayed={options.length}
      />
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!value} className="min-w-32">
          Continue
        </Button>
      </div>
    </div>
  )
}

interface DateStepProps {
  label: string
  value: Date | undefined
  onChange: (value: Date | undefined) => void
  onNext: () => void
  help?: string
  fromYear?: number
  toYear?: number
}

/**
 * Date of birth on the proven shadcn `DatePicker` (calendar). Range is enforced
 * by the picker's fromYear/toYear. Requires an explicit Continue — no premature
 * or keystroke auto-advance.
 */
export function DateStep({
  label,
  value,
  onChange,
  onNext,
  help,
  fromYear,
  toYear,
}: DateStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <DatePicker
        id="onboarding-dob"
        value={value}
        onChange={onChange}
        placeholder="Select your date of birth"
        fromYear={fromYear}
        toYear={toYear}
        className="h-14 text-base"
      />
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!value} className="min-w-32">
          Continue
        </Button>
      </div>
    </div>
  )
}
