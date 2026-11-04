import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      {/* Back link skeleton */}
      <Skeleton className="mb-3 mt-1.5 h-5 w-36" />

      {/* Hero skeleton */}
      <Skeleton className="h-64 rounded-3xl sm:h-52" />

      {/* Content skeletons - 5 sections */}
      <div className="mx-auto mt-10 max-w-2xl space-y-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
