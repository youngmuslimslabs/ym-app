'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { FilterPill } from './FilterPill'
import type { PeopleFilters as PeopleFiltersType, FilterCategory } from '../types'

interface PeopleFiltersProps {
  filters: PeopleFiltersType
  filterCategories: FilterCategory[]
  onFilterChange: (
    category: keyof Omit<PeopleFiltersType, 'search' | 'yearsInYM'>,
    values: string[]
  ) => void
  onClearCategory: (category: keyof Omit<PeopleFiltersType, 'search' | 'yearsInYM'>) => void
  onClearAll: () => void
}

export function PeopleFilters({
  filters,
  filterCategories,
  onFilterChange,
  onClearCategory,
  onClearAll,
}: PeopleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Get active filter categories (those with selected values)
  const activeCategories = filterCategories.filter(
    (cat) => filters[cat.id] && filters[cat.id].length > 0
  )

  const hasActiveFilters = activeCategories.length > 0

  const handleToggleOption = (
    categoryId: keyof Omit<PeopleFiltersType, 'search' | 'yearsInYM'>,
    optionId: string
  ) => {
    const currentValues = filters[categoryId] || []
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId]
    onFilterChange(categoryId, newValues)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter Dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeCategories.length}
                <span className="sr-only"> active filters</span>
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Filter by
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {filterCategories.map((category) => {
            const selectedValues = filters[category.id] || []
            const hasSelections = selectedValues.length > 0

            return (
              <DropdownMenuSub key={category.id}>
                <DropdownMenuSubTrigger className="flex items-center justify-between">
                  <span>{category.label}</span>
                  {hasSelections && (
                    <span className="ml-auto mr-2 text-xs text-muted-foreground">
                      {selectedValues.length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                  {category.options.map((option) => {
                    const isChecked = selectedValues.includes(option.id)
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.id}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleOption(category.id, option.id)}
                        onSelect={(e) => e.preventDefault()} // Keep menu open
                      >
                        {option.name}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Pills */}
      {activeCategories.map((category) => {
        const count = filters[category.id]?.length || 0
        return (
          <FilterPill
            key={category.id}
            label={category.label}
            count={count}
            onClick={() => setIsOpen(true)}
            onClear={() => onClearCategory(category.id)}
          />
        )
      })}

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}
