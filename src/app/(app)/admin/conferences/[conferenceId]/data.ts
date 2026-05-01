import { createClient } from '@/lib/supabase/server'
import { getPeoplePageData } from '@/app/(app)/people/data'
import type {
  AdminSession,
  Conference,
  ConferenceEditorView,
  SessionFeedbackAggregate,
} from '../types'

// All columns admins are allowed to see — including check_in_code, which is
// stripped at the query layer for attendees in /conferences/.../data.ts.
const ADMIN_SESSION_COLUMNS =
  'id, conference_id, start_at, end_at, title, description, speaker, room, is_break, capacity, check_in_code, created_at, updated_at'

export async function getConferenceEditorView(
  conferenceId: string
): Promise<ConferenceEditorView | null> {
  const supabase = await createClient()

  const { data: confRow } = await supabase
    .from('conferences')
    .select('*')
    .eq('id', conferenceId)
    .maybeSingle()
  if (!confRow) return null
  const conference = confRow as Conference

  const [sessionsRes, attendeesRes, peopleData] = await Promise.all([
    supabase
      .from('sessions')
      .select(ADMIN_SESSION_COLUMNS)
      .eq('conference_id', conferenceId)
      .order('start_at', { ascending: true }),
    supabase
      .from('conference_attendees')
      .select('user_id')
      .eq('conference_id', conferenceId),
    getPeoplePageData(),
  ])
  const sessions = (sessionsRes.data ?? []) as AdminSession[]
  const sessionIds = sessions.map((s) => s.id)
  const attendeeRows = (attendeesRes.data ?? []) as { user_id: string }[]
  const invitedCount = attendeeRows.length
  const invitedUserIds = attendeeRows.map((r) => r.user_id)

  const signupCounts: Record<string, number> = {}
  const checkInCounts: Record<string, number> = {}
  const feedbackBySession: Record<string, SessionFeedbackAggregate> = {}
  let feedbackCount = 0

  if (sessionIds.length > 0) {
    // Fetch full feedback rows so we can aggregate per session ourselves
    // (avg + count). Volume is small — bounded by attendees * sessions — and
    // the Stage 6 ranked list is the only consumer, so a single round trip
    // beats one aggregate query per session.
    const [signupsRes, checkInsRes, feedbackRes] = await Promise.all([
      supabase
        .from('session_signups')
        .select('session_id')
        .in('session_id', sessionIds),
      supabase
        .from('session_check_ins')
        .select('session_id')
        .in('session_id', sessionIds),
      supabase
        .from('session_feedback')
        .select('session_id, rating')
        .in('session_id', sessionIds),
    ])
    for (const r of (signupsRes.data ?? []) as { session_id: string }[]) {
      signupCounts[r.session_id] = (signupCounts[r.session_id] ?? 0) + 1
    }
    for (const r of (checkInsRes.data ?? []) as { session_id: string }[]) {
      checkInCounts[r.session_id] = (checkInCounts[r.session_id] ?? 0) + 1
    }
    for (const r of (feedbackRes.data ?? []) as {
      session_id: string
      rating: number
    }[]) {
      const agg = feedbackBySession[r.session_id] ?? { count: 0, sum: 0 }
      agg.count += 1
      agg.sum += r.rating
      feedbackBySession[r.session_id] = agg
    }
    feedbackCount = (feedbackRes.data ?? []).length
  }

  return {
    conference,
    sessions,
    signupCounts,
    checkInCounts,
    feedbackBySession,
    invitedCount,
    feedbackCount,
    attendees: {
      people: peopleData.people,
      filterCategories: peopleData.filterCategories,
      invitedUserIds,
    },
  }
}
