// Brothers / Sisters — which side of the organization a member belongs to.
// Stored in `users.side` (00024), chosen once during onboarding and immutable
// for app users afterwards (an admin corrects mistakes). It drives the brand
// theme, but only on screens that have adopted the brand: <BrandScope> reads
// the cookie below and sets `data-theme-side` on its own subtree, which selects
// the Brothers or Sisters palette in globals.css. No side means General.

export const SIDES = ['brothers', 'sisters'] as const
export type Side = (typeof SIDES)[number]

export const SIDE_LABELS: Record<Side, string> = {
  brothers: 'Brothers',
  sisters: 'Sisters',
}

export function isSide(value: unknown): value is Side {
  return typeof value === 'string' && (SIDES as readonly string[]).includes(value)
}

// Read on the server by <BrandScope> (see lib/side-server.ts). Not sensitive
// (it's visible in the directory), so it doesn't need to be httpOnly.
// Middleware keeps it in sync with the DB and clears it on sign-out.
export const SIDE_COOKIE = 'ym_side'
export const SIDE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Client-side: remember a side right after it's saved, before the next request. */
export function rememberSide(side: Side): void {
  document.cookie = `${SIDE_COOKIE}=${side}; Path=/; Max-Age=${SIDE_COOKIE_MAX_AGE}; SameSite=Lax`
}

/** Client-side: forget the side (sign-out), so the next person gets General. */
export function forgetSide(): void {
  document.cookie = `${SIDE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}
