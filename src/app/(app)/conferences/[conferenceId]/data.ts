import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRow } from '@/lib/supabase/current-user'
import type {
  Conference,
  ScheduleView,
  Session,
} from './types'

const SESSION_COLUMNS =
  'id, conference_id, start_at, end_at, title, description, speaker, room, is_break, capacity, created_at, updated_at'
// NOTE: check_in_code is intentionally omitted — attendee responses must
// never include it. RLS allows reads of the column to attendees, so the
// guard lives here at the query layer (per the design's password-non-leak rule).

/**
 * Fetch everything an attendee needs to render the schedule for one conference.
 * Returns null if:
 *   - User is not authenticated
 *   - Conference doesn't exist OR user has no read access to it (RLS)
 */
export async function getConferenceScheduleData(
  conferenceId: string
): Promise<ScheduleView | null> {
  const supabase = await createClient()

  // The user lookup, conference and sessions are independent — run them
  // together. RLS returns zero conference/session rows if the user isn't
  // invited, so nothing leaks by not waiting on the user row first.
  const [userRow, conferenceRes, sessionsRes] = await Promise.all([
    getCurrentUserRow(),
    supabase.from('conferences').select('*').eq('id', conferenceId).maybeSingle(),
    // All sessions for this conference (excluding check_in_code)
    supabase
      .from('sessions')
      .select(SESSION_COLUMNS)
      .eq('conference_id', conferenceId)
      .order('start_at', { ascending: true }),
  ])
  if (!userRow) return null
  const currentUserId = userRow.id

  if (conferenceRes.error || !conferenceRes.data) return null
  const conference = conferenceRes.data as Conference

  const sessions = (sessionsRes.data ?? []) as Session[]
  const sessionIds = sessions.map((s) => s.id)

  if (sessionIds.length === 0) {
    return {
      conference,
      sessions: [],
      signupCounts: {},
      mySignupSessionIds: new Set(),
      myCheckInSessionIds: new Set(),
      myFeedback: {},
      currentUserId,
    }
  }

  // All signups for these sessions (so we can count seats per session).
  // RLS allows attendees to see signups for sessions in their conferences.
  const [signupsRes, myCheckInsRes, myFeedbackRes] = await Promise.all([
    supabase
      .from('session_signups')
      .select('session_id, user_id')
      .in('session_id', sessionIds),
    supabase
      .from('session_check_ins')
      .select('session_id')
      .in('session_id', sessionIds)
      .eq('user_id', currentUserId),
    supabase
      .from('session_feedback')
      .select('session_id, rating, comment')
      .in('session_id', sessionIds)
      .eq('user_id', currentUserId),
  ])

  const allSignups = (signupsRes.data ?? []) as { session_id: string; user_id: string }[]
  const signupCounts: Record<string, number> = {}
  const mySignupSessionIds = new Set<string>()
  for (const s of allSignups) {
    signupCounts[s.session_id] = (signupCounts[s.session_id] ?? 0) + 1
    if (s.user_id === currentUserId) mySignupSessionIds.add(s.session_id)
  }

  const myCheckInSessionIds = new Set<string>(
    ((myCheckInsRes.data ?? []) as { session_id: string }[]).map((c) => c.session_id)
  )

  const myFeedback: ScheduleView['myFeedback'] = {}
  for (const f of (myFeedbackRes.data ?? []) as {
    session_id: string
    rating: number
    comment: string | null
  }[]) {
    myFeedback[f.session_id] = { rating: f.rating, comment: f.comment }
  }

  return {
    conference,
    sessions,
    signupCounts,
    mySignupSessionIds,
    myCheckInSessionIds,
    myFeedback,
    currentUserId,
  }
}
