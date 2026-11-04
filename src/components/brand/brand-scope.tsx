import { cn } from '@/lib/utils'

/** Opt a route into the single shared YM brand without changing other routes. */
export function BrandScope({ bare = false, className, children }: {
  bare?: boolean
  className?: string
  children: React.ReactNode
}) {
  return <div data-theme="ym" className={cn('font-sans tracking-brand text-foreground', !bare && 'bg-background', className)}>{children}</div>
}
