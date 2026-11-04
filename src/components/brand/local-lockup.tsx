import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/logo'

// Local lockup (Brandbook p.49–50): the stacked logo with a subregion or
// Neighbor Net name set beneath it, e.g. YOUNG MUSLIMS / HOUSTON. Kalos made
// poster versions for four cities only, so the app builds the rest in code.
// Colour comes from `currentColor`; `placeClassName` can pick out the place
// name (the book often sets it in the accent colour).

interface LocalLockupProps {
  place: string
  className?: string
  placeClassName?: string
}

export function LocalLockup({ place, className, placeClassName }: LocalLockupProps) {
  return (
    <div className={cn('inline-flex flex-col items-start gap-2', className)}>
      <Logo variant="stacked" className="h-16" />
      <span className={cn('font-display text-lg uppercase leading-tight', placeClassName)}>
        {place}
      </span>
    </div>
  )
}
