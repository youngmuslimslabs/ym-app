'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PeopleSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PeopleSearch({
  value,
  onChange,
  placeholder = 'Search people...',
}: PeopleSearchProps) {
  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-9 pr-9 h-10 bg-background"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange('')}
        className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7',
          'text-muted-foreground hover:text-foreground',
          'transition-opacity duration-200',
          value ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        tabIndex={value ? 0 : -1}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Clear search</span>
      </Button>
    </div>
  )
}
