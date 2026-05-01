import { Skeleton } from '@/components/ui/skeleton'
import { PersonCardGridSkeleton } from './components/PersonCardSkeleton'

/**
 * Loading UI for the people directory page.
 * Shown automatically by Next.js while the page's server component is loading.
 */
export default function PeopleLoading() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-screen">
      {/* Header skeleton */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search skeleton */}
            <Skeleton className="h-10 w-64" />
            {/* Filter buttons skeleton (hidden on mobile) */}
            <div className="hidden md:flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
            {/* Spacer */}
            <div className="flex-1" />
            {/* View toggle skeleton */}
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <div className="flex-1 px-4 md:px-6 py-6">
        <PersonCardGridSkeleton count={12} />
      </div>
    </div>
  )
}
