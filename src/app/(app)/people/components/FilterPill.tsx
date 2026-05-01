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
      className="h-7 pl-3 pr-1 gap-1.5 cursor-pointer hover:bg-secondary/80 transition-colors"
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
        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Clear {label} filter</span>
      </button>
    </Badge>
  )
}
