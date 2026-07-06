/**
 * Google Workspace → Supabase user sync script
 *
 * Fetches all @youngmuslims.com users from Google Workspace Admin Directory
 * and upserts them into the public.users table. Safe to run multiple times —
 * never overwrites user-provided data. This is a thin wrapper around the shared
 * sync core (src/lib/sync/google-users.ts) that the /admin route also uses, so
 * fetch + normalization + upsert behavior is identical across both triggers.
 * Unlike the route it needs no app login, which makes it the recovery path when
 * you're locked out of the app.
 *
 * Prerequisites:
 *   1. Google Cloud service account with Admin SDK API enabled
 *   2. Domain-wide delegation with scope:
 *      https://www.googleapis.com/auth/admin.directory.user.readonly
 *   3. Environment variables set (see below)
 *
 * Usage:
 *   bun run sync:google
 */

import { createClient } from '@supabase/supabase-js'

import {
  fetchGoogleWorkspaceUsers,
  upsertGoogleUsers,
} from '@/lib/sync/google-users'
import type { Database } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
  /\\n/g,
  '\n',
)
const GOOGLE_ADMIN_EMAIL = process.env.GOOGLE_ADMIN_EMAIL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function checkEnv() {
  const missing: string[] = []
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  if (!GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  if (!GOOGLE_ADMIN_EMAIL) missing.push('GOOGLE_ADMIN_EMAIL')
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    console.error('Missing required environment variables:')
    missing.forEach((v) => console.error(`  - ${v}`))
    process.exit(1)
  }
}

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

async function main() {
  checkEnv()

  console.log('Fetching Google Workspace users...')
  const googleUsers = await fetchGoogleWorkspaceUsers({
    serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    privateKey: GOOGLE_PRIVATE_KEY!,
    adminEmail: GOOGLE_ADMIN_EMAIL!,
  })
  console.log(`Found ${googleUsers.length} Google Workspace users.\n`)

  const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
  const result = await upsertGoogleUsers(supabase, googleUsers)

  console.log('--- Sync Summary ---')
  console.log(`  New users added:  ${result.created}`)
  console.log(`  Users updated:    ${result.updated}`)
  console.log(`  Already current:  ${result.skipped}`)
  console.log(`  Errors:           ${result.errors}`)
  console.log(`  Total processed:  ${result.total}`)

  if (result.errors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
