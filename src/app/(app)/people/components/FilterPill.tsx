'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FilterPillProps {
  label: string
  count: number
  onClick: () => void
  onClear: () => void
}

export function FilterPill({ label, count, onClick, onClear }: FilterPillProps) {
  return (
    <Badge
      variant="secondary"
      className="h-8 gap-1.5 rounded-full pl-3 pr-1 cursor-pointer transition-colors duration-200 hover:bg-secondary/80"
    >
      <span onClick={onClick} className="flex items-center gap-1.5">
        <span className="font-medium">{label}:</span>
        <span className="text-muted-foreground">{count} selected</span>
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        className="ml-1 rounded-full p-1 transition-colors duration-200 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Clear {label} filter</span>
      </button>
    </Badge>
  )
}
