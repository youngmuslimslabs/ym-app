// Brothers / Sisters — which side of the organization a member belongs to.
// Stored in `users.side` (00024), chosen once during onboarding and immutable
// for app users afterwards (an admin corrects mistakes). It drives the brand
// theme: `data-theme-side` on <html> selects the Brothers or Sisters palette
// in globals.css; no attribute means the General theme.

export const SIDES = ['brothers', 'sisters'] as const
export type Side = (typeof SIDES)[number]

export const SIDE_LABELS: Record<Side, string> = {
  brothers: 'Brothers',
  sisters: 'Sisters',
}

export function isSide(value: unknown): value is Side {
  return typeof value === 'string' && (SIDES as readonly string[]).includes(value)
}

// Readable by the inline <head> script so the theme is set before first paint
// without making the root layout dynamic. Not sensitive (it's visible in the
// directory), so it doesn't need to be httpOnly. Middleware keeps it in sync
// with the DB and clears it on sign-out.
export const SIDE_COOKIE = 'ym_side'
export const SIDE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const THEME_SIDE_ATTRIBUTE = 'data-theme-side'

// Runs in <head> before the body paints. Kept tiny and dependency-free; it must
// only ever set one of the two known values.
export const SIDE_THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${SIDE_COOKIE}=(brothers|sisters)(?:;|$)/);if(m)document.documentElement.setAttribute('${THEME_SIDE_ATTRIBUTE}',m[1])}catch(e){}})()`

/** Client-side: apply a side immediately (theme + cookie) after it's saved. */
export function applySideTheme(side: Side): void {
  document.documentElement.setAttribute(THEME_SIDE_ATTRIBUTE, side)
  document.cookie = `${SIDE_COOKIE}=${side}; Path=/; Max-Age=${SIDE_COOKIE_MAX_AGE}; SameSite=Lax`
}

/** Client-side: back to the General theme (sign-out). */
export function clearSideTheme(): void {
  document.documentElement.removeAttribute(THEME_SIDE_ATTRIBUTE)
  document.cookie = `${SIDE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}
