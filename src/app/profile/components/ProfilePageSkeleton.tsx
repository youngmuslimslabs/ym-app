import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full page skeleton for the profile edit page.
 * Matches the layout with header and 5 sections.
 */
export function ProfilePageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Back link, title, and identity card skeletons (same spacing as the page) */}
      <main className="flex-1 px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-2xl space-y-12">
          <div className="space-y-6">
            <Skeleton className="h-11 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 max-w-full" />
              <Skeleton className="h-5 w-56 max-w-full" />
            </div>
            <div className="flex items-center gap-4 rounded-2xl border bg-card p-6">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
            </div>
          </div>

          {/* Personal Info Section Skeleton */}
          <ProfileSectionSkeleton
            titleWidth="w-40"
            subtitleWidth="w-56"
            fieldCount={4}
          />

          {/* YM Roles Section Skeleton */}
          <ProfileSectionSkeleton
            titleWidth="w-36"
            subtitleWidth="w-48"
            fieldCount={2}
            showCard
          />

          {/* YM Projects Section Skeleton */}
          <ProfileSectionSkeleton
            titleWidth="w-44"
            subtitleWidth="w-52"
            fieldCount={2}
            showCard
          />

          {/* Education Section Skeleton */}
          <ProfileSectionSkeleton
            titleWidth="w-32"
            subtitleWidth="w-44"
            fieldCount={3}
          />

          {/* Skills Section Skeleton */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

interface ProfileSectionSkeletonProps {
  titleWidth: string
  subtitleWidth: string
  fieldCount: number
  showCard?: boolean
}

function ProfileSectionSkeleton({
  titleWidth,
  subtitleWidth,
  fieldCount,
  showCard = false,
}: ProfileSectionSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="space-y-1">
        <Skeleton className={`h-6 ${titleWidth}`} />
        <Skeleton className={`h-4 ${subtitleWidth}`} />
      </div>

      {/* Fields or card */}
      {showCard ? (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          {Array.from({ length: fieldCount }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: fieldCount }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
