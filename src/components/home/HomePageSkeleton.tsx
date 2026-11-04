import { Skeleton } from '@/components/ui/skeleton'

export function AttendanceSkeleton() {
  return <div className="space-y-3" aria-busy="true" aria-label="Loading conference"><Skeleton className="h-6 w-28" /><Skeleton className="h-56 rounded-3xl" /></div>
}

export function HomePageSkeleton() {
  return <div className="ym-revised-screen mx-auto max-w-[1064px] space-y-6 bg-background p-4 sm:p-8" role="status" aria-label="Loading home">
    <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-5 w-4/5" /></div>
    <AttendanceSkeleton />
    <div className="space-y-3"><Skeleton className="h-6 w-32" /><Skeleton className="h-48 rounded-3xl" /></div>
    <Skeleton className="h-24 rounded-2xl" />
  </div>
}
