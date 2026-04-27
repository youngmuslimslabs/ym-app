'use client'

import { createClient } from '@/lib/supabase/client'
import type { CheckInResult, FeedbackResult, SignupResult } from './types'

export async function signupForSession(sessionId: string): Promise<SignupResult> {
  const supabase = createClient()
  const { data, error } = await (supabase as any).rpc('signup_for_session', {
    p_session_id: sessionId,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as SignupResult
}

export async function cancelSignup(sessionId: string): Promise<SignupResult> {
  const supabase = createClient()
  const { data, error } = await (supabase as any).rpc('cancel_signup', {
    p_session_id: sessionId,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as SignupResult
}

export async function checkInToSession(
  sessionId: string,
  code: string
): Promise<CheckInResult> {
  const supabase = createClient()
  const { data, error } = await (supabase as any).rpc('check_in_to_session', {
    p_session_id: sessionId,
    p_code: code,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data as CheckInResult
}

// UPSERT direct to session_feedback. RLS gates INSERT on end_at < NOW();
// UPDATE on own rows is unrestricted (24h window is a soft UI suggestion only).
export async function upsertFeedback(
  sessionId: string,
  userId: string,
  rating: number,
  comment: string | null
): Promise<FeedbackResult> {
  const supabase = createClient()
  const trimmed = comment?.trim() ?? ''
  const payload = {
    session_id: sessionId,
    user_id: userId,
    rating,
    comment: trimmed.length > 0 ? trimmed : null,
  }
  const { data, error } = await (supabase as any)
    .from('session_feedback')
    .upsert(payload, { onConflict: 'session_id,user_id' })
    .select('rating, comment')
    .maybeSingle()
  if (error) {
    return { success: false, error: error.message }
  }
  return {
    success: true,
    feedback: data
      ? { rating: data.rating as number, comment: data.comment as string | null }
      : { rating, comment: payload.comment },
  }
}
