// Hand-written types for the admin conferences views.
// Mirrors the locked decision in 2026-04-25-conference-staged-build.md:
// admin pages CAN show seat counts; attendee pages cannot.

import type { Conference, Session } from '@/app/(app)/conferences/[conferenceId]/types'
import type { PersonListItem } from '@/lib/supabase/queries/people'
import type { FilterCategory } from '@/app/(app)/people/types'

export type { Conference, Session }

export type ConferenceLifecycleStatus = 'draft' | 'live' | 'past'

export interface AdminConferenceRow {
  id: string
  name: string
  tagline: string | null
  location: string | null
  start_date: string
  end_date: string
  status: 'draft' | 'published'
  invitedCount: number
}

// Full session including check_in_code — admin queries can read this column.
export interface AdminSession extends Session {
  check_in_code: string | null
}

// Map session_id → aggregate feedback metrics. Drives the ranked list in the
// admin Feedback tab. `sum` lets the client compute avg = sum / count without
// passing floats through Postgres aggregation.
export interface SessionFeedbackAggregate {
  count: number
  sum: number
}

export interface ConferenceEditorView {
  conference: Conference
  sessions: AdminSession[]
  // Map session_id → seat count. Admins see this; attendees do not.
  signupCounts: Record<string, number>
  // Map session_id → check-in count.
  checkInCounts: Record<string, number>
  // Map session_id → { count, sum }. Sessions with no feedback are omitted.
  feedbackBySession: Record<string, SessionFeedbackAggregate>
  invitedCount: number
  feedbackCount: number
  // Data backing the Attendees tab (AttendeePicker). Eager-loaded with the
  // editor view since the user count is small; revisit if the directory grows.
  attendees: {
    people: PersonListItem[]
    filterCategories: FilterCategory[]
    invitedUserIds: string[]
  }
}

export interface SimpleResult {
  success: boolean
  error?: string
}
