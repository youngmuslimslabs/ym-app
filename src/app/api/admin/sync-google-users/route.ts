import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getPostHogServer } from '@/lib/posthog/server'
import {
  fetchGoogleWorkspaceUsers,
  upsertGoogleUsers,
  SyncStepError,
} from '@/lib/sync/google-users'
import type { Database } from '@/types/database.types'

// Netlify extended function timeout — sync of ~2000 users takes ~5s but
// give headroom for cold starts and larger orgs
export const maxDuration = 60

export async function POST() {
  const startTime = Date.now()
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (!userRow) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminFlag } = await supabase.rpc('is_event_admin', {
    p_user_id: userRow.id,
  })
  if (!adminFlag) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceEmail || !privateKey || !adminEmail || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfigured: missing Google credentials' }, { status: 500 })
  }

  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey)

  // Proactively mark stale in_progress rows as failed (covers hard-timeout cases
  // where the Netlify function died before it could update the row itself).
  await adminClient
    .from('sync_logs')
    .update({ status: 'failed', completed_at: new Date().toISOString() })
    .eq('status', 'in_progress')
    .lt('started_at', new Date(Date.now() - 120_000).toISOString())

  // The unique partial index (sync_logs_one_active) makes this INSERT atomic —
  // if another sync is running, Postgres rejects it with code 23505.
  const { data: syncLog, error: logInsertError } = await adminClient
    .from('sync_logs')
    .insert({ triggered_by: userRow.id, status: 'in_progress' })
    .select('id')
    .single()

  if (logInsertError) {
    if (logInsertError.code === '23505') {
      return NextResponse.json({ error: 'A sync is already in progress' }, { status: 409 })
    }
    console.error('[sync] Failed to create sync_log row:', logInsertError.message)
    // Non-lock error: proceed without an audit row rather than blocking the sync
  } else if (!syncLog) {
    console.error('[sync] sync_log INSERT succeeded but id was not returned — proceeding without audit row')
  }

  const syncLogId = syncLog?.id
  const triggeredByUserId = userRow.id

  async function failSync(message: string, status: number, step: string) {
    if (syncLogId) {
      await adminClient
        .from('sync_logs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', syncLogId)
    }
    try {
      getPostHogServer().capture({
        distinctId: triggeredByUserId,
        event: 'admin_google_sync_failed',
        properties: {
          error_message: message,
          step,
        },
      })
    } catch { /* observability */ }
    try {
      await getPostHogServer().flush()
    } catch { /* ignore flush errors */ }
    return NextResponse.json({ error: message }, { status })
  }

  let googleUsers
  try {
    googleUsers = await fetchGoogleWorkspaceUsers({
      serviceAccountEmail: serviceEmail,
      privateKey,
      adminEmail,
    })
  } catch {
    return failSync('Failed to fetch users from Google', 502, 'google_fetch')
  }

  let result
  try {
    result = await upsertGoogleUsers(adminClient, googleUsers)
  } catch (e) {
    if (e instanceof SyncStepError) {
      return failSync(e.message, 500, e.step)
    }
    return failSync('Failed to upsert users', 500, 'upsert')
  }

  if (syncLogId) {
    await adminClient
      .from('sync_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_count: result.total,
        created_count: result.created,
        updated_count: result.updated,
        skipped_count: result.skipped,
        errors_count: result.errors,
      })
      .eq('id', syncLogId)
  }

  try {
    getPostHogServer().capture({
      distinctId: userRow.id,
      event: 'admin_google_sync_completed',
      properties: {
        users_added: result.created,
        users_updated: result.updated,
        duration_ms: Date.now() - startTime,
      },
    })
  } catch { /* observability */ }
  try {
    await getPostHogServer().flush()
  } catch { /* ignore flush errors */ }

  return NextResponse.json(result)
}
