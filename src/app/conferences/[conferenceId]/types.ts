// Hand-written types for the conferences feature.
// TODO: regenerate database.types.ts from Supabase once CLI auth is restored,
// then we can drop these in favor of Database['public']['Tables'] types.

export type ConferenceStatus = 'draft' | 'published'

export interface Conference {
  id: string
  name: string
  description: string | null
  location: string | null
  timezone: string
  start_date: string // YYYY-MM-DD
  end_date: string
  status: ConferenceStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  conference_id: string
  start_at: string // ISO timestamptz
  end_at: string
  title: string
  description: string | null
  speaker: string | null
  room: string | null
  is_break: boolean
  capacity: number | null
  // check_in_code is intentionally NOT exposed in attendee queries.
  created_at: string
  updated_at: string
}

// View object passed from server → client
export interface ScheduleView {
  conference: Conference
  sessions: Session[]
  // Map of session_id → seat count (for capacity displays)
  signupCounts: Record<string, number>
  // Sets of session_ids the current user has interacted with
  mySignupSessionIds: Set<string>
  myCheckInSessionIds: Set<string>
  // Map of session_id → user's rating for it (so we can render "you rated 4/5")
  myFeedback: Record<string, { rating: number; comment: string | null }>
  // Current user id (for client mutations)
  currentUserId: string
}

// Time-derived state for a session (computed in client based on `now`)
export type SessionTimeState = 'upcoming' | 'in_progress' | 'ended'

// Full state for rendering one card
export type SessionCardState =
  | { kind: 'break' }
  | { kind: 'upcoming'; signedUp: boolean; full: boolean }
  | { kind: 'in_progress'; signedUp: boolean; checkedIn: boolean }
  | { kind: 'ended'; signedUp: boolean; checkedIn: boolean; rated: boolean }

export interface SignupResult {
  success: boolean
  error?: string
  replaced_session_ids?: string[]
}
