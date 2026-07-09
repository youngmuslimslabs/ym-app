'use client'

import { useState } from 'react'
import { Check, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface TagOption {
  value: string
  label: string
}

interface TagChipSelectorProps {
  options: TagOption[]
  selected: string[]
  onToggle: (value: string) => void
  /** Show an "Add your own" affordance for free-text tags (e.g. contribution tags). */
  allowCustom?: boolean
  className?: string
}

export function TagChipSelector({
  options,
  selected,
  onToggle,
  allowCustom = false,
  className,
}: TagChipSelectorProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  // Selected values that aren't in the fixed option list are custom tags —
  // render them as chips too so they can be toggled off.
  const optionValues = new Set(options.map((o) => o.value))
  const customChips: TagOption[] = selected
    .filter((v) => !optionValues.has(v))
    .map((v) => ({ value: v, label: v }))
  const chips = [...options, ...customChips]

  function commitDraft() {
    const value = draft.trim()
    if (!value) return
    onToggle(value)
    setDraft('')
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {chips.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(option.value)}
            className={cn(
              'group rounded-full transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            )}
          >
            <Badge
              variant={isSelected ? 'default' : 'secondary'}
              className={cn(
                'flex max-w-full items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer transition-all duration-200',
                // wrap long custom labels instead of overflowing
                'whitespace-normal text-left break-words',
                isSelected && 'pr-2.5',
                !isSelected && 'hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {isSelected && <Check className="h-3 w-3 shrink-0" />}
              {option.label}
            </Badge>
          </button>
        )
      })}

      {allowCustom && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer border-dashed text-muted-foreground transition-colors duration-200 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            Add your own
          </Badge>
        </button>
      )}

      {allowCustom && adding && (
        <input
          type="text"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitDraft()
            } else if (e.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
          onBlur={() => {
            // Clicking out of the field commits a non-empty draft, then closes.
            commitDraft()
            setAdding(false)
          }}
          placeholder="Type and press Enter"
          className={cn(
            'h-8 min-w-[8rem] max-w-full rounded-full border border-input bg-background px-3 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          )}
        />
      )}
    </div>
  )
}
