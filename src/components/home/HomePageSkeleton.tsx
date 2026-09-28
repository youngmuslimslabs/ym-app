import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full page skeleton for the home page. Mirrors the live layout: the colour
 * hero (greeting, role chips, place), then the three action tiles and the
 * stats panel.
 */
export function HomePageSkeleton() {
  return (
    <div className="pb-16">
      <div className="bg-primary">
        <div className="mx-auto max-w-5xl space-y-4 px-6 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14">
          <Skeleton className="h-4 w-40 bg-white/15" />
          <Skeleton className="h-14 w-2/3 max-w-sm bg-white/15" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-7 w-44 rounded-full bg-white/15" />
          </div>
          <Skeleton className="h-4 w-48 bg-white/15" />
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pt-10 sm:px-10">
        <section className="space-y-5">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-2xl sm:h-36" />
            <Skeleton className="h-20 rounded-2xl sm:h-36" />
            <Skeleton className="h-20 rounded-2xl sm:h-36" />
          </div>
        </section>

        <section className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 rounded-3xl" />
        </section>
      </div>
    </div>
  )
}
