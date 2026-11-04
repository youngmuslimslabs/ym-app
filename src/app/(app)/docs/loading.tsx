import { Skeleton } from '@/components/ui/skeleton'

export default function DocsLoading() {
  return <div role="status" aria-label="Loading documents" className="w-full max-w-[1064px] space-y-6 px-4 py-5 sm:px-8 sm:py-8">
    <div className="space-y-3"><Skeleton className="h-7 w-24 bg-secondary" /><Skeleton className="h-4 w-4/5 max-w-sm bg-secondary" /></div>
    <div className="space-y-3"><Skeleton className="h-5 w-32 bg-secondary" /><div className="divide-y divide-border overflow-hidden rounded-3xl border bg-card">{[0, 1].map(row => <div key={row} className="flex min-h-14 items-center gap-4 p-4"><Skeleton className="size-6 rounded-full bg-secondary" /><Skeleton className="h-4 w-3/5 bg-secondary" /></div>)}</div></div>
    <div className="space-y-3"><Skeleton className="h-5 w-56 max-w-full bg-secondary" /><div className="divide-y divide-border overflow-hidden rounded-3xl border bg-card">{[0, 1, 2, 3, 4].map(row => <div key={row} className="flex min-h-14 items-center gap-4 p-4"><Skeleton className="h-4 w-2/5 bg-secondary" /><Skeleton className="h-6 w-14 rounded-full bg-secondary" /></div>)}</div></div>
    <span className="sr-only">Loading documents…</span>
  </div>
}
