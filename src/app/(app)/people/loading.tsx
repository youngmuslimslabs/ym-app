import { Skeleton } from '@/components/ui/skeleton'
import { PersonCardGridSkeleton } from './components/PersonCardSkeleton'

/**
 * Loading UI for the people directory page.
 * Shown automatically by Next.js while the page's server component is loading.
 * Mirrors the loaded layout: page title, toolbar, card grid.
 */
export default function PeopleLoading() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 md:min-h-screen md:pt-10">
      {/* Page title skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>

      {/* Toolbar skeleton */}
      <div className="-mx-4 mt-6 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Search skeleton */}
          <Skeleton className="h-11 w-full rounded-xl sm:w-80" />
          {/* Filter button skeleton (hidden on mobile) */}
          <Skeleton className="hidden h-11 w-24 rounded-xl md:block" />
          {/* Spacer */}
          <div className="flex-1" />
          {/* View toggle skeleton */}
          <Skeleton className="hidden h-10 w-20 rounded-xl md:block" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 pt-4">
        <PersonCardGridSkeleton count={12} />
      </div>
    </div>
  )
}
