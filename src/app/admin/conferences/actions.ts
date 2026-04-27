'use client'

import { createClient } from '@/lib/supabase/client'
import type { SimpleResult } from './types'

// Admin client mutations. RLS gates everything to event_admin role. Server
// only checks "is the user an event_admin" before rendering — the actual
// authorization happens at the database layer (RLS + SECURITY DEFINER fns).

export interface CreateConferenceInput {
  name: string
  tagline: string | null
  start_date: string // YYYY-MM-DD
  end_date: string
  timezone: string
  location: string | null
  description: string | null
}

export async function createConference(
  input: CreateConferenceInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('conferences')
    .insert({
      name: input.name,
      tagline: input.tagline,
      start_date: input.start_date,
      end_date: input.end_date,
      timezone: input.timezone,
      location: input.location,
      description: input.description,
    })
    .select('id')
    .maybeSingle()
  if (error) return { success: false, error: error.message }
  if (!data) return { success: false, error: 'Insert returned no row' }
  return { success: true, id: data.id as string }
}

export interface UpdateConferenceInput {
  name?: string
  tagline?: string | null
  start_date?: string
  end_date?: string
  timezone?: string
  location?: string | null
  description?: string | null
}

export async function updateConference(
  id: string,
  patch: UpdateConferenceInput
): Promise<SimpleResult> {
  const supabase = createClient()
  const { error } = await (supabase as any)
    .from('conferences')
    .update(patch)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteConference(id: string): Promise<SimpleResult> {
  const supabase = createClient()
  const { error } = await (supabase as any).from('conferences').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function publishConference(id: string): Promise<SimpleResult> {
  const supabase = createClient()
  const { data, error } = await (supabase as any).rpc('publish_conference', {
    p_id: id,
  })
  if (error) return { success: false, error: error.message }
  return data as SimpleResult
}

// Sessions ------------------------------------------------------------------

export interface SessionInput {
  conference_id: string
  start_at: string // ISO timestamptz
  end_at: string
  title: string
  description: string | null
  speaker: string | null
  room: string | null
  is_break: boolean
  capacity: number | null
  check_in_code: string | null
}

export async function createSession(
  input: SessionInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('sessions')
    .insert(input)
    .select('id')
    .maybeSingle()
  if (error) return { success: false, error: friendlySessionError(error.message) }
  if (!data) return { success: false, error: 'Insert returned no row' }
  return { success: true, id: data.id as string }
}

export async function updateSession(
  id: string,
  patch: Partial<SessionInput>
): Promise<SimpleResult> {
  const supabase = createClient()
  const { error } = await (supabase as any).from('sessions').update(patch).eq('id', id)
  if (error) return { success: false, error: friendlySessionError(error.message) }
  return { success: true }
}

export async function deleteSession(id: string): Promise<SimpleResult> {
  const supabase = createClient()
  const { error } = await (supabase as any).from('sessions').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Translates the most common DB-level errors into actionable messages. The
// trigger error wording comes from enforce_capacity_floor() in migration 00013.
function friendlySessionError(raw: string): string {
  if (/Cannot reduce capacity below current signup count/i.test(raw)) {
    return raw.replace(/^.*?Cannot/, 'Cannot')
  }
  if (/end_at > start_at/i.test(raw)) {
    return 'End time must be after start time.'
  }
  return raw
}
