import { cn } from '@/lib/utils'
import type { Side } from '@/lib/side'

/**
 * Opts a subtree into the Young Muslims brand: the Brandbook tokens
 * (`data-theme="ym"`), Figtree, and -2% tracking, plus the member's Brothers
 * or Sisters palette and logo when `side` is given. Anything outside a scope
 * keeps today's styling, so a screen adopts the brand by being wrapped in this,
 * in its own reviewable change, and never by editing `:root`.
 *
 * Wrap a route with it from a `layout.tsx` (see `(app)/home/layout.tsx`); pass
 * the side from `getSide()` in `@/lib/side-server`. Pure, so it also works in
 * client components (SideStep uses it to preview the chosen side).
 *
 * `bare` skips the page background, for scopes that sit inside another surface.
 */
export function BrandScope({
  side,
  bare = false,
  className,
  children,
}: {
  side?: Side | null
  bare?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-theme="ym"
      data-theme-side={side ?? undefined}
      className={cn(
        'font-sans tracking-brand text-foreground',
        !bare && 'bg-background',
        className,
      )}
    >
      {children}
    </div>
  )
}
