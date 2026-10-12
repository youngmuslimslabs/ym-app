import { cookies } from 'next/headers'

import { isSide, SIDE_COOKIE, type Side } from '@/lib/side'

/**
 * The signed-in member's side from the `ym_side` cookie (kept in sync with
 * users.side by middleware), or null for General. Server-only; reading cookies
 * makes the calling route dynamic, which every signed-in route already is.
 */
export async function getSide(): Promise<Side | null> {
  const value = (await cookies()).get(SIDE_COOKIE)?.value
  return isSide(value) ? value : null
}
