'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PersonCardSkeleton() {
  return (
    <Card className="h-full">
      <div className="p-6">
        {/* Header: Avatar + Name + Location */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar skeleton */}
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />

          {/* Name and Location skeleton */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Roles skeleton */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Skills skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </Card>
  )
}

interface PersonCardGridSkeletonProps {
  count?: number
}

export function PersonCardGridSkeleton({ count = 8 }: PersonCardGridSkeletonProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-full">
          <PersonCardSkeleton />
        </div>
      ))}
    </div>
  )
}
