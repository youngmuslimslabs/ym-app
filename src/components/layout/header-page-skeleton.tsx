import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading UI for pages using the bordered eyebrow / title / subtitle header
 * (admin tools, admin conferences, the conference editor and the attendee
 * schedule). Mirrors that header's spacing so the real page swaps in without
 * a layout jump.
 */
export function HeaderPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="px-6 md:px-8 pt-10 md:pt-12 pb-6 border-b space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="px-6 md:px-8 py-8 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
