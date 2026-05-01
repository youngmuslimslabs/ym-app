import { Skeleton } from '@/components/ui/skeleton'

/**
 * Full page skeleton for the home page.
 * Mirrors the editorial Variant D layout: greeting hero, hairline rule,
 * three labeled sections (identity, quick actions, stats strip).
 * No card chrome — same restraint as the live page.
 */
export function HomePageSkeleton() {
  return (
    <div className="px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto flex max-w-[600px] flex-col">
        {/* Greeting (two lines) */}
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="mt-2 h-12 w-1/2" />

        <hr className="mt-12 mb-14 border-t border-border" />

        {/* "Who you are" */}
        <section className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </section>

        {/* "Quick actions" */}
        <section className="mt-14 space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </section>

        {/* "At a glance" */}
        <section className="mt-14 space-y-3">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-cols-3 gap-8 pt-2">
            <div className="space-y-3">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
