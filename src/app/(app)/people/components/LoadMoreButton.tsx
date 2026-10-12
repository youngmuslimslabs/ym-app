'use client'

import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadMoreButtonProps {
  hasMore: boolean
  onLoadMore: () => void
}

export function LoadMoreButton({ hasMore, onLoadMore }: LoadMoreButtonProps) {
  if (!hasMore) return null

  return (
    <div className="flex justify-center pt-8">
      <Button
        variant="outline"
        onClick={onLoadMore}
        className="h-11 gap-2 rounded-xl bg-card px-6 transition-all duration-200 hover:shadow-sm"
      >
        Load more
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
