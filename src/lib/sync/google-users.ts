/**
 * Shared Google Workspace → Supabase user sync core.
 *
 * Both sync triggers use this module so the fetch + normalize + upsert logic
 * lives in exactly one place and can never drift:
 *   - the /admin API route (auth + sync_logs audit/lock + PostHog wrapper)
 *   - the `sync:google` CLI script (env-check + console wrapper, no app login)
 *
 * The sync is additive and non-destructive: it inserts new users and backfills
 * only NULL name/avatar fields on existing users. It never overwrites populated
 * data and never deletes rows. Names and emails are canonicalized at fetch time
 * (see normalizeEmail / normalizeName), so every write path is consistent.
 */
import { google } from 'googleapis'
import type { SupabaseClient } from '@supabase/supabase-js'

import { normalizeEmail } from '@/lib/email'
import { normalizeName } from '@/lib/name'
import type { Database } from '@/types/database.types'

const DIRECTORY_SCOPE = 'https://www.googleapis.com/auth/admin.directory.user.readonly'
const WORKSPACE_DOMAIN = 'youngmuslims.com'
const INSERT_CHUNK = 50 // rows per bulk insert
const UPDATE_BATCH = 50 // concurrent update requests per batch
const EXISTING_PAGE = 1000

export interface GoogleSyncCredentials {
  serviceAccountEmail: string
  privateKey: string
  adminEmail: string
}

/** A user pulled from the Directory, already normalized for storage. */
export interface SyncUser {
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  errors: number
  total: number
}

/** Diagnostics for a single row that failed to insert or update. */
export interface RowError {
  email: string
  phase: 'insert' | 'update'
  message: string
}

export interface UpsertOptions {
  /**
   * Called once per failed row so a caller can surface diagnostics. The CLI
   * script logs these to the console; the route omits it deliberately — emails
   * must not reach telemetry/logs (see CLAUDE.md PII rule).
   */
  onRowError?: (error: RowError) => void
}

/**
 * Signals a hard failure at a named step so callers can record it (the route
 * writes the step to sync_logs / PostHog; the script prints it).
 */
export class SyncStepError extends Error {
  constructor(
    public readonly step: string,
    message: string,
  ) {
    super(message)
    this.name = 'SyncStepError'
  }
}

/**
 * Fetch every @youngmuslims.com account from the Workspace Admin Directory,
 * paginating fully, and return them normalized for storage. Authenticates via a
 * service-account JWT with domain-wide delegation. Throws on Google failure.
 */
export async function fetchGoogleWorkspaceUsers(
  creds: GoogleSyncCredentials,
): Promise<SyncUser[]> {
  const auth = new google.auth.JWT({
    email: creds.serviceAccountEmail,
    key: creds.privateKey,
    scopes: [DIRECTORY_SCOPE],
    subject: creds.adminEmail,
  })

  const directory = google.admin({ version: 'directory_v1', auth })
  const users: SyncUser[] = []
  let pageToken: string | undefined

  do {
    const res = await directory.users.list({
      domain: WORKSPACE_DOMAIN,
      maxResults: 500,
      pageToken,
      projection: 'basic',
    })
    for (const user of res.data.users ?? []) {
      if (!user.primaryEmail) continue
      users.push({
        // Normalize so the seeded row matches the OAuth login identity
        // regardless of casing/whitespace (src/lib/email.ts + migration 00017).
        email: normalizeEmail(user.primaryEmail),
        // Fix all-upper/all-lower Directory names so users are stored correctly
        // cased regardless of how Google casts the source record (src/lib/name.ts).
        firstName: normalizeName(user.name?.givenName ?? null),
        lastName: normalizeName(user.name?.familyName ?? null),
        avatarUrl: user.thumbnailPhotoUrl ?? null,
      })
    }
    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return users
}

type ExistingUser = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

/**
 * Upsert the fetched users into public.users: insert new rows and backfill only
 * NULL fields on existing rows. Insert/update failures are counted (not thrown)
 * so one bad row never aborts the run; a failure to LOAD existing users is a
 * hard error and throws SyncStepError('fetch_existing').
 */
export async function upsertGoogleUsers(
  supabase: SupabaseClient<Database>,
  googleUsers: SyncUser[],
  options: UpsertOptions = {},
): Promise<SyncResult> {
  const { onRowError } = options
  // Load all existing users (Supabase caps each page at 1000).
  const allExisting: ExistingUser[] = []
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, avatar_url')
      .range(page * EXISTING_PAGE, (page + 1) * EXISTING_PAGE - 1)
    if (error) throw new SyncStepError('fetch_existing', 'Failed to fetch existing users')
    if (!data || data.length === 0) break
    allExisting.push(...(data as ExistingUser[]))
    if (data.length < EXISTING_PAGE) break
  }
  const existingMap = new Map(allExisting.map((u) => [u.email, u]))

  const toInsert = googleUsers.filter((g) => !existingMap.has(g.email))
  const toCheck = googleUsers.filter((g) => existingMap.has(g.email))

  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  // Bulk-insert new users in chunks. On chunk failure, retry row-by-row to
  // isolate bad rows so a single bad email doesn't silently drop the chunk.
  for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
    const chunk = toInsert.slice(i, i + INSERT_CHUNK)
    const { error } = await supabase.from('users').insert(
      chunk.map((g) => ({
        email: g.email,
        first_name: g.firstName,
        last_name: g.lastName,
        avatar_url: g.avatarUrl,
      })),
    )
    if (!error) {
      created += chunk.length
    } else {
      for (const g of chunk) {
        const { error: rowErr } = await supabase.from('users').insert({
          email: g.email,
          first_name: g.firstName,
          last_name: g.lastName,
          avatar_url: g.avatarUrl,
        })
        if (rowErr) {
          errors += 1
          onRowError?.({ email: g.email, phase: 'insert', message: rowErr.message })
        } else {
          created += 1
        }
      }
    }
  }

  // Update existing rows with missing fields — batched to cap concurrent
  // connections.
  for (let i = 0; i < toCheck.length; i += UPDATE_BATCH) {
    const batch = toCheck.slice(i, i + UPDATE_BATCH)
    const batchResults = await Promise.all(
      batch.map(async (gUser) => {
        const existing = existingMap.get(gUser.email)!
        const updates: Record<string, string> = {}
        if (!existing.first_name && gUser.firstName) updates.first_name = gUser.firstName
        if (!existing.last_name && gUser.lastName) updates.last_name = gUser.lastName
        if (!existing.avatar_url && gUser.avatarUrl) updates.avatar_url = gUser.avatarUrl

        if (Object.keys(updates).length === 0) return 'skipped' as const
        const { error } = await supabase.from('users').update(updates).eq('id', existing.id)
        if (error) {
          onRowError?.({ email: gUser.email, phase: 'update', message: error.message })
          return 'error' as const
        }
        return 'updated' as const
      }),
    )
    for (const r of batchResults) {
      if (r === 'skipped') skipped++
      else if (r === 'updated') updated++
      else errors++
    }
  }

  return { created, updated, skipped, errors, total: googleUsers.length }
}
