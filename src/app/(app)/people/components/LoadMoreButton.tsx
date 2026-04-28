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
    <div className="flex justify-center pt-6">
      <Button
        variant="outline"
        onClick={onLoadMore}
        className="gap-2 transition-all duration-200 hover:shadow-sm"
      >
        Load more
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
