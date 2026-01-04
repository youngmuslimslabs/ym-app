"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxValue {
  type: "existing" | "custom"
  value: string
  label?: string
}

interface SearchableComboboxProps {
  options: ComboboxOption[]
  value?: ComboboxValue
  onChange: (value: ComboboxValue | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  allowCustom?: boolean
  disabled?: boolean
  className?: string
  /** Limit displayed results for performance with large lists */
  maxDisplayed?: number
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  allowCustom = false,
  disabled = false,
  className,
  maxDisplayed = 50,
}: SearchableComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Filter options based on search, limit for performance
  const filteredOptions = React.useMemo(() => {
    if (!search) return options.slice(0, maxDisplayed)

    const searchLower = search.toLowerCase()
    return options
      .filter((option) => option.label.toLowerCase().includes(searchLower))
      .slice(0, maxDisplayed)
  }, [options, search, maxDisplayed])

  // Check if search matches any existing option exactly
  const exactMatch = React.useMemo(() => {
    if (!search) return false
    return options.some(
      (option) => option.label.toLowerCase() === search.toLowerCase()
    )
  }, [options, search])

  // Display value
  const displayValue = React.useMemo(() => {
    if (!value) return null
    if (value.type === "custom") return value.value
    return value.label || options.find((o) => o.value === value.value)?.label
  }, [value, options])

  const handleSelect = (selectedValue: string) => {
    const option = options.find((o) => o.value === selectedValue)
    if (option) {
      onChange({ type: "existing", value: option.value, label: option.label })
    }
    setOpen(false)
    setSearch("")
  }

  const handleAddCustom = () => {
    onChange({ type: "custom", value: search })
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredOptions.length === 0 && !allowCustom && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            {filteredOptions.length === 0 && allowCustom && search && (
              <CommandEmpty className="py-2">
                <button
                  onClick={handleAddCustom}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add &ldquo;{search}&rdquo;
                </button>
              </CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.type === "existing" && value?.value === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {allowCustom && search && !exactMatch && filteredOptions.length > 0 && (
                <CommandItem onSelect={handleAddCustom} className="border-t">
                  <Plus className="mr-2 h-4 w-4" />
                  Add &ldquo;{search}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
