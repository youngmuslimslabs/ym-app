'use client'

import { createClient } from '@/lib/supabase/client'
import type { SignupResult } from './types'

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
