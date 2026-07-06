import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getPostHogServer } from '@/lib/posthog/server'
import { normalizeName } from '@/lib/name'
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

  const auth = new google.auth.JWT({
    email: serviceEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: adminEmail,
  })

  const directory = google.admin({ version: 'directory_v1', auth })
  const googleUsers: { email: string; firstName: string | null; lastName: string | null; avatarUrl: string | null }[] = []
  let pageToken: string | undefined

  try {
    do {
      const res = await directory.users.list({
        domain: 'youngmuslims.com',
        maxResults: 500,
        pageToken,
        projection: 'basic',
      })
      for (const user of res.data.users ?? []) {
        if (!user.primaryEmail) continue
        googleUsers.push({
          // Normalize to lowercase — Google can return mixed-case addresses,
          // which would cause false "new user" hits and unique-constraint failures
          email: user.primaryEmail.toLowerCase().trim(),
          // Fix all-upper/all-lower Directory names at write time so new and
          // backfilled users are stored correctly cased (see src/lib/name.ts).
          firstName: normalizeName(user.name?.givenName ?? null),
          lastName: normalizeName(user.name?.familyName ?? null),
          avatarUrl: user.thumbnailPhotoUrl ?? null,
        })
      }
      pageToken = res.data.nextPageToken ?? undefined
    } while (pageToken)
  } catch {
    return failSync('Failed to fetch users from Google', 502, 'google_fetch')
  }

  // Fetch all existing users via pagination (Supabase caps each page at 1000)
  type ExistingUser = { id: string; email: string; first_name: string | null; last_name: string | null; avatar_url: string | null }
  const allExisting: ExistingUser[] = []
  const PAGE = 1000
  for (let page = 0; ; page++) {
    const { data, error } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name, avatar_url')
      .range(page * PAGE, (page + 1) * PAGE - 1)
    if (error) return failSync('Failed to fetch existing users', 500, 'fetch_existing')
    if (!data || data.length === 0) break
    allExisting.push(...(data as ExistingUser[]))
    if (data.length < PAGE) break
  }
  const existingMap = new Map(allExisting.map((u) => [u.email, u]))

  // Split into new vs existing
  const toInsert = googleUsers.filter((g) => !existingMap.has(g.email))
  const toCheck = googleUsers.filter((g) => existingMap.has(g.email))

  let created = 0, updated = 0, skipped = 0, errors = 0

  // Bulk-insert new users in chunks. On chunk failure, retry row-by-row to
  // isolate bad rows so a single bad email doesn't silently drop 49 good users.
  const CHUNK = 50
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)
    const { error } = await adminClient.from('users').insert(
      chunk.map((g) => ({
        email: g.email,
        first_name: g.firstName,
        last_name: g.lastName,
        avatar_url: g.avatarUrl,
      }))
    )
    if (!error) {
      created += chunk.length
    } else {
      // Retry individually so only the bad row(s) count as errors
      for (const g of chunk) {
        const { error: rowErr } = await adminClient.from('users').insert({
          email: g.email,
          first_name: g.firstName,
          last_name: g.lastName,
          avatar_url: g.avatarUrl,
        })
        if (rowErr) errors += 1; else created += 1
      }
    }
  }

  // Update existing rows with missing fields — batched to cap concurrent DB connections
  for (let i = 0; i < toCheck.length; i += CHUNK) {
    const batch = toCheck.slice(i, i + CHUNK)
    const batchResults = await Promise.all(
      batch.map(async (gUser) => {
        const existing = existingMap.get(gUser.email)!
        const updates: Record<string, string> = {}
        if (!existing.first_name && gUser.firstName) updates.first_name = gUser.firstName
        if (!existing.last_name && gUser.lastName) updates.last_name = gUser.lastName
        if (!existing.avatar_url && gUser.avatarUrl) updates.avatar_url = gUser.avatarUrl

        if (Object.keys(updates).length === 0) return 'skipped' as const
        const { error } = await adminClient.from('users').update(updates).eq('id', existing.id)
        return error ? 'error' as const : 'updated' as const
      })
    )
    for (const r of batchResults) {
      if (r === 'skipped') skipped++
      else if (r === 'updated') updated++
      else errors++
    }
  }

  const result = { created, updated, skipped, errors, total: googleUsers.length }

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
