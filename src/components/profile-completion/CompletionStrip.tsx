'use client'

import { UserRoundPen, ChevronRight } from 'lucide-react'

interface CompletionStripProps {
  resolvedCount: number
  total: number
  percent: number
  onClick: () => void
}

/** Persistent "finish your profile" prompt shown at the top of app pages while incomplete. */
export function CompletionStrip({ resolvedCount, total, percent, onClick }: CompletionStripProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-left transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <UserRoundPen className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          Finish setting up your profile
        </span>
        <span className="block text-xs text-muted-foreground">
          {resolvedCount} of {total} sections done
        </span>
      </span>
      <span className="hidden h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-primary/20 sm:block">
        <span
          className="block h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{percent}%</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
    </button>
  )
}
