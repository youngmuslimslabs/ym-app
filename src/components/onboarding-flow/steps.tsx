'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResponsiveSelect } from '@/components/responsive-select'
import { DatePicker } from '@/components/ui/date-picker'
import { SearchableCombobox, type ComboboxValue } from '@/components/searchable-combobox'
import { cn } from '@/lib/utils'

function StepHeader({ label, help }: { label: string; help?: string }) {
  return (
    <div>
      <h1 className="text-[22px] font-bold leading-tight tracking-brand sm:text-[28px] text-balance">{label}</h1>
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
  const fieldId = useId()
  const [touched, setTouched] = useState(false)
  // With a validator, advance only when VALID; otherwise fall back to non-empty.
  const canAdvance = validate ? validate(value) : value.trim().length > 0
  // Show the error only after the field is touched (blurred) and the entered,
  // non-empty value fails validation — the original onboarding's `touched` pattern.
  const showError = touched && value.trim().length > 0 && !!validate && !validate(value)

  return (
    <div className="ym-onboarding-step">
      <StepHeader label={label} help={help} />
      <div className="flex flex-col gap-1.5">
        <Input
          id={fieldId}
          aria-label={label}
          aria-describedby={showError ? `${fieldId}-error` : undefined}
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
            'h-12 rounded-[10px] bg-card text-base',
            showError && 'border-destructive focus-visible:ring-destructive',
          )}
        />
        {showError && errorMessage && (
          <p id={`${fieldId}-error`} role="alert" className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
      <div className="ym-onboarding-actions">
        <Button onClick={onNext} disabled={!canAdvance} className="min-h-11 w-full rounded-[10px]">
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
  presentation?: 'dropdown' | 'list'
  searchLabel?: string
  emptyHelp?: string
}

/** Reuse the existing dropdown for Role; reviewed geography uses visible rows. */
export function SelectStep({
  label,
  options,
  onSelect,
  onNext,
  value,
  placeholder = 'Select an option',
  help,
  presentation = 'dropdown',
  searchLabel = 'Search choices',
  emptyHelp,
}: SelectStepProps) {
  if (presentation === 'list') return <VisibleChoiceStep label={label} help={help} options={options} value={value} onSelect={onSelect} onNext={onNext} searchLabel={searchLabel} emptyHelp={emptyHelp} />
  return (
    <div className="ym-onboarding-step">
      <StepHeader label={label} help={help} />
      <ResponsiveSelect
        options={options}
        value={value || undefined}
        onValueChange={onSelect}
        placeholder={placeholder}
        triggerClassName="h-14 text-base"
      />
      <div className="ym-onboarding-actions">
        <Button onClick={onNext} disabled={!value} className="min-h-11 w-full rounded-[10px]">
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
    <div className="ym-onboarding-step">
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
      <div className="ym-onboarding-actions">
        <Button onClick={onNext} disabled={!value} className="min-h-11 w-full rounded-[10px]">
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
    <div className="ym-onboarding-step">
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
      <div className="ym-onboarding-actions">
        <Button onClick={onNext} disabled={!value} className="min-h-11 w-full rounded-[10px]">
          Continue
        </Button>
      </div>
    </div>
  )
}

function VisibleChoiceStep({ label, help, options, value, onSelect, onNext, searchLabel, emptyHelp }: SelectStepProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const matches = options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  const validSelection = options.some(option => option.value === value)
  return <div className="ym-onboarding-step ym-onboarding-choices">
    <StepHeader label={label} />
    <div className="space-y-2"><label htmlFor={id} className="block text-sm leading-tight">{searchLabel}</label>
      <Input id={id} type="search" value={query} placeholder="Search by name" onChange={event => setQuery(event.target.value)} className="h-12 rounded-[10px] bg-card" />
      {help && <p className="pt-2 text-xs leading-tight text-muted-foreground">{help}</p>}
    </div>
    <fieldset className="min-w-0 space-y-2"><legend className="sr-only">{label}</legend>
      {matches.map(option => <label key={option.value} className={cn('relative flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[10px] border bg-card px-4 py-3 text-center text-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', value === option.value && 'border-primary bg-secondary')}>
        <input type="radio" name={`${id}-choice`} value={option.value} checked={value === option.value} onChange={() => onSelect(option.value)} className="sr-only" />
        {option.label}{value === option.value && <span aria-hidden="true">✓</span>}
      </label>)}
      {!matches.length && <div role="status" className="space-y-2 rounded-xl border bg-card p-4 text-sm"><p>{options.length ? 'No matches found.' : 'No options are available here yet.'}</p>{query && <Button type="button" variant="outline" className="min-h-11" onClick={() => setQuery('')}>Clear search</Button>}</div>}
    </fieldset>
    {emptyHelp && <p className="text-xs text-muted-foreground">{emptyHelp}</p>}
    <div className="ym-onboarding-actions"><Button onClick={onNext} disabled={!validSelection} className="min-h-11 w-full rounded-[10px]">Continue</Button></div>
  </div>
}
