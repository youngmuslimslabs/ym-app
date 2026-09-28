import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full page skeleton for the home page. Mirrors the live layout: the Obsidian
 * hero card (greeting, role chips, place), then the three action tiles and the
 * stats row.
 */
export function HomePageSkeleton() {
  return (
    <div className="pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="space-y-4 rounded-3xl bg-brand-obsidian p-6 sm:p-10">
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
          <Skeleton className="h-24 rounded-2xl" />
        </section>
      </div>
    </div>
  )
}
