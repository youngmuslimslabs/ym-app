"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface ResponsiveSelectOption {
  value: string
  label: string
}

interface ResponsiveSelectProps {
  options: ResponsiveSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Applied to the trigger in both variants (e.g. "h-14 text-base"). */
  triggerClassName?: string
}

/**
 * A single-select that anchors its options to the trigger on desktop (the proven
 * Radix <Select>) but presents them in a centered modal on mobile. Anchored Radix
 * Select content clips or scroll-locks on small viewports (issue #59); a modal is
 * decoupled from the trigger, so it can't. Desktop rendering is unchanged.
 */
export function ResponsiveSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled,
  triggerClassName,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const selectedOptionRef = React.useRef<HTMLButtonElement>(null)

  // Match native <Select>, which scrolls the current selection into view when
  // the menu opens — otherwise a long list (e.g. ~190 nationalities) opens at the
  // top with the checked item off-screen.
  React.useEffect(() => {
    if (open) selectedOptionRef.current?.scrollIntoView({ block: "center" })
  }, [open])

  if (isMobile) {
    const selected = options.find((o) => o.value === value)
    const handleSelect = (v: string) => {
      onValueChange(v)
      setOpen(false)
    }
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm font-normal shadow-sm",
              !selected && "text-muted-foreground",
              triggerClassName
            )}
          >
            <span className="line-clamp-1">{selected ? selected.label : placeholder}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-[calc(100vw-2rem)] gap-0 rounded-lg p-0 sm:max-w-sm"
        >
          <DialogTitle className="px-4 pb-2 pt-4 text-base font-semibold">
            {placeholder}
          </DialogTitle>
          <div
            role="listbox"
            aria-label={placeholder}
            className="max-h-[60dvh] overflow-y-auto p-1"
          >
            {options.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  ref={isSelected ? selectedOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-3 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent/50"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
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
  )
}
