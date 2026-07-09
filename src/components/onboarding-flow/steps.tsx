'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
}: TextStepProps) {
  const canAdvance = value.trim().length > 0

  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <Input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        autoFocus
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && canAdvance) {
            e.preventDefault()
            onNext()
          }
        }}
        className="h-14 text-base"
      />
      <div className="flex items-center justify-between gap-3">
        <Button onClick={onNext} disabled={!canAdvance} className="min-w-32">
          {ctaLabel}
        </Button>
        <span className="text-xs text-muted-foreground">press Enter ↵</span>
      </div>
    </div>
  )
}

export interface ChoiceOption {
  value: string
  label: string
}

interface ChoiceStepProps {
  label: string
  options: ChoiceOption[]
  onSelect: (value: string) => void
  selected?: string
  help?: string
}

/** Typeform single choice: tapping an option advances immediately. */
export function ChoiceStep({ label, options, onSelect, selected, help }: ChoiceStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = option.value === selected
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.value)}
              className={cn(
                'w-full rounded-lg border px-4 py-3.5 text-left text-[15px] font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:border-primary/20',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DateStepProps {
  label: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
  min?: string
  max?: string
  help?: string
}

/** Native date input (iOS wheel). Picking a date advances. Range is JS-validated by the caller. */
export function DateStep({ label, value, onChange, onNext, min, max, help }: DateStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader label={label} help={help} />
      <input
        type="date"
        aria-label={label}
        value={value}
        min={min}
        max={max}
        autoFocus
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value) onNext()
        }}
        className={cn(
          'h-14 w-full rounded-md border border-input bg-background px-4 text-base',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        )}
      />
    </div>
  )
}
