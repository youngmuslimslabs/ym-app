import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading UI for the admin pages. Mirrors PageHeader's spacing (back link,
 * title, description) and the card rows under it, so the real page swaps in
 * without a jump. The shared HeaderPageSkeleton still describes the old
 * bordered header that other screens use.
 */
export function AdminPageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-16 pt-8 sm:px-10 sm:pt-12"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
