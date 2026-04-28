import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AdminConferenceRow } from './types'

// Resolves the current user's public.users.id and returns it along with their
// admin status. Used by every admin server component to gate access.
export async function resolveAdminContext(): Promise<
  | { isAdmin: true; userId: string }
  | { isAdmin: false; userId: string | null; reason: 'unauth' | 'not-admin' }
> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return { isAdmin: false, userId: null, reason: 'unauth' }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (!userRow) return { isAdmin: false, userId: null, reason: 'unauth' }

  // is_event_admin() function is the single source of truth — same one RLS
  // policies use, so what we check here matches what the DB will allow.
  const { data: adminFlag } = await supabase.rpc('is_event_admin', {
    p_user_id: userRow.id,
  })
  if (!adminFlag) {
    return { isAdmin: false, userId: userRow.id as string, reason: 'not-admin' }
  }
  return { isAdmin: true, userId: userRow.id as string }
}

// Convenience: redirect non-admins to /home. Pages call this before any other
// data fetch so we never leak data to a non-admin even if RLS hadn't caught it.
export async function requireAdmin(): Promise<string> {
  const ctx = await resolveAdminContext()
  if (!ctx.isAdmin) redirect('/home')
  return ctx.userId
}

export async function getAdminConferenceList(): Promise<AdminConferenceRow[]> {
  const supabase = await createClient()
  // RLS for conferences allows admins full SELECT, so this returns all rows.
  // We hand-count attendees because PostgREST's count modifier on a join
  // requires extra round-trips. One pass through conference_attendees gives
  // us a Map<conference_id, count> for free.
  const { data: confRows, error: confErr } = await supabase
    .from('conferences')
    .select('id, name, tagline, location, start_date, end_date, status')
    .order('start_date', { ascending: false })
  if (confErr || !confRows) return []

  const { data: attendeeRows } = await supabase
    .from('conference_attendees')
    .select('conference_id')
  const counts: Record<string, number> = {}
  for (const r of (attendeeRows ?? []) as { conference_id: string }[]) {
    counts[r.conference_id] = (counts[r.conference_id] ?? 0) + 1
  }

  return (confRows as AdminConferenceRow[]).map((c) => ({
    ...c,
    invitedCount: counts[c.id] ?? 0,
  }))
}
