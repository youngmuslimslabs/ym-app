import { createClient } from '@/lib/supabase/server'

export interface UpcomingAttendance {
  conferenceId: string
  name: string
  startDate: string
  endDate: string
  isLive: boolean
}

/**
 * Fetch the current user's most-imminent published conference within
 * the next 30 days, or null if there isn't one.
 *
 * Why this is two queries instead of relying on RLS: the SELECT policy
 * on `conferences` (00013_conferences_feature.sql) is `EXISTS(attendee
 * row) OR is_event_admin(...)`. An event admin would otherwise see
 * every published conference here and the home page would render an
 * "Attending" card for a conference they aren't actually on. Explicit
 * filter on `conference_attendees.user_id` is the *intent* boundary;
 * RLS underneath is the security boundary.
 *
 * The 30-day horizon is a product call: a conference 3 months out
 * isn't actionable from the home slot yet, so it doesn't earn it.
 */
export async function fetchUpcomingAttendance(): Promise<UpcomingAttendance | null> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (!userRow) return null

  const { data: attendeeRows, error: attendeeErr } = await supabase
    .from('conference_attendees')
    .select('conference_id')
    .eq('user_id', userRow.id)
  if (attendeeErr) {
    console.error('fetchUpcomingAttendance: attendee lookup failed', attendeeErr)
    return null
  }
  if (!attendeeRows?.length) return null

  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  const horizon = new Date(today)
  horizon.setUTCDate(horizon.getUTCDate() + 30)
  const horizonIso = horizon.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('conferences')
    .select('id, name, start_date, end_date')
    .in(
      'id',
      attendeeRows.map((r) => r.conference_id),
    )
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
