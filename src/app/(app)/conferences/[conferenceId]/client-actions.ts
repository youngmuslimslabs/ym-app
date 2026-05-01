'use client'

// Client-side mutations called from attendee UI components. These are NOT
// Next.js Server Actions — the file uses 'use client' and the browser
// Supabase client. Authorization lives in the database (RLS + SECURITY
// DEFINER RPCs like signup_for_session / cancel_signup / check_in_to_session).

import { createClient } from '@/lib/supabase/client'
import type { CheckInResult, FeedbackResult, SignupResult } from './types'

export async function signupForSession(sessionId: string): Promise<SignupResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('signup_for_session', {
    p_session_id: sessionId,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as unknown as SignupResult
}

export async function cancelSignup(sessionId: string): Promise<SignupResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('cancel_signup', {
    p_session_id: sessionId,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as unknown as SignupResult
}

export async function checkInToSession(
  sessionId: string,
  code: string
): Promise<CheckInResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('check_in_to_session', {
    p_session_id: sessionId,
    p_code: code,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as unknown as CheckInResult
}

// UPSERT direct to session_feedback. RLS gates INSERT on end_at < NOW();
// UPDATE on own rows is unrestricted (24h window is a soft UI suggestion only).
// User identity is resolved server-side from the auth session — never trust a
// client-supplied user_id.
export async function upsertFeedback(
  sessionId: string,
  rating: number,
  comment: string | null
): Promise<FeedbackResult> {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return { success: false, error: 'Not signed in' }
  }
  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (!userRow) {
    return { success: false, error: 'No account found for this user' }
  }

  const trimmed = comment?.trim() ?? ''
  const payload = {
    session_id: sessionId,
    user_id: userRow.id as string,
    rating,
    comment: trimmed.length > 0 ? trimmed : null,
  }
  const { data, error } = await supabase
    .from('session_feedback')
    .upsert(payload, { onConflict: 'session_id,user_id' })
    .select('rating, comment')
    .maybeSingle()
  if (error) {
    return { success: false, error: friendlyFeedbackError(error.message) }
  }
  if (!data) {
    // Upsert succeeded but returned no row — the INSERT path was rejected
    // silently (e.g., RLS WITH CHECK), or RLS hid the resulting row. Don't
    // fabricate an echo; tell the caller the write didn't land.
    return { success: false, error: "Couldn't save feedback. Try again." }
  }
  return {
    success: true,
    feedback: {
      rating: data.rating as number,
      comment: data.comment as string | null,
    },
  }
}

function friendlyFeedbackError(raw: string): string {
  if (/row-level security/i.test(raw)) {
    return "Feedback isn't open for this session yet."
  }
  return raw
}
