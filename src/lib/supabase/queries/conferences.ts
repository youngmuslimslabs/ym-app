import { createClient } from '@/lib/supabase/server'

export interface UpcomingAttendance {
  conferenceId: string
  name: string
  startDate: string
  endDate: string
  isLive: boolean
}

/**
 * Fetch the user's most-imminent published conference within the next
 * 30 days, or null if there isn't one.
 *
 * RLS on `conferences` already restricts visibility to users who are
 * attendees, so a plain `select` returns only conferences the caller
 * is invited to. The `authId` argument isn't sent to Postgres — the
 * supabase server client picks the user's session up from cookies and
 * RLS keys off `auth.uid()`. We accept it on the signature to mirror
 * `fetchUserContext(user.id)` so callers don't have to remember which
 * queries do or don't take an id.
 *
 * The 30-day horizon is a product call: a conference 3 months out
 * isn't actionable from the home page yet, so it doesn't earn the
 * slot above the fold.
 */
export async function fetchUpcomingAttendance(
  authId: string
): Promise<UpcomingAttendance | null> {
  void authId
  const supabase = await createClient()

  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const horizon = new Date(today)
  horizon.setUTCDate(horizon.getUTCDate() + 30)
  const horizonIso = horizon.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('conferences')
    .select('id, name, start_date, end_date')
    .eq('status', 'published')
    .gte('end_date', todayIso)
    .lte('start_date', horizonIso)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('fetchUpcomingAttendance: query failed', error)
    return null
  }
  if (!data) return null

  const isLive = data.start_date <= todayIso && todayIso <= data.end_date

  return {
    conferenceId: data.id,
    name: data.name,
    startDate: data.start_date,
    endDate: data.end_date,
    isLive,
  }
}
