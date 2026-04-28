import { createClient } from '@/lib/supabase/server'
import { getPeoplePageData } from '@/app/people/data'
import type {
  AdminSession,
  Conference,
  ConferenceEditorView,
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
  let feedbackCount = 0

  if (sessionIds.length > 0) {
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
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds),
    ])
    for (const r of (signupsRes.data ?? []) as { session_id: string }[]) {
      signupCounts[r.session_id] = (signupCounts[r.session_id] ?? 0) + 1
    }
    for (const r of (checkInsRes.data ?? []) as { session_id: string }[]) {
      checkInCounts[r.session_id] = (checkInCounts[r.session_id] ?? 0) + 1
    }
    feedbackCount = feedbackRes.count ?? 0
  }

  return {
    conference,
    sessions,
    signupCounts,
    checkInCounts,
    invitedCount,
    feedbackCount,
    attendees: {
      people: peopleData.people,
      filterCategories: peopleData.filterCategories,
      invitedUserIds,
    },
  }
}
