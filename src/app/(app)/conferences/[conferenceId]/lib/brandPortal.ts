import type { Side } from '@/lib/side'

// Radix renders Sheet/Dialog content in a portal on <body>, outside the
// <BrandScope> that conferences/layout.tsx puts around the route, so it would
// fall back to the legacy tokens. Spreading these onto the portalled content
// element re-applies the same scope (tokens, side palette, Figtree, tracking)
// to that element and everything inside it. Same output as <BrandScope bare>,
// but on the element Radix owns, so the content's own background and border
// resolve to brand tokens too.
export function brandPortalProps(side: Side | null | undefined) {
  return {
    'data-theme': 'ym',
    'data-theme-side': side ?? undefined,
  } as const
}

export const BRAND_PORTAL_CLASS = 'font-sans tracking-brand text-foreground'
