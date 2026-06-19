/**
 * Google Workspace → Supabase user sync script
 *
 * Fetches all @youngmuslims.com users from Google Workspace Admin Directory
 * and upserts them into the public.users table. Safe to run multiple times —
 * never overwrites user-provided data.
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

import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

import { normalizeEmail } from '@/lib/email'

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
// Google Admin SDK
// ---------------------------------------------------------------------------

interface GoogleUser {
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

async function fetchAllGoogleUsers(): Promise<GoogleUser[]> {
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'],
    subject: GOOGLE_ADMIN_EMAIL,
  })

  const directory = google.admin({ version: 'directory_v1', auth })
  const users: GoogleUser[] = []
  let pageToken: string | undefined

  do {
    const res = await directory.users.list({
      domain: 'youngmuslims.com',
      maxResults: 500,
      pageToken,
      projection: 'basic',
    })

    for (const user of res.data.users ?? []) {
      if (!user.primaryEmail) continue
      users.push({
        // Normalize so the seeded row matches the OAuth login identity
        // regardless of casing/whitespace (see src/lib/email.ts + migration
        // 00017). Used for both the .eq('email', ...) lookup and the insert.
        email: normalizeEmail(user.primaryEmail),
        firstName: user.name?.givenName ?? null,
        lastName: user.name?.familyName ?? null,
        avatarUrl: user.thumbnailPhotoUrl ?? null,
      })
    }

    pageToken = res.data.nextPageToken ?? undefined
  } while (pageToken)

  return users
}

// ---------------------------------------------------------------------------
// Sync logic
// ---------------------------------------------------------------------------

async function main() {
  checkEnv()

  console.log('Fetching Google Workspace users...')
  const googleUsers = await fetchAllGoogleUsers()
  console.log(`Found ${googleUsers.length} Google Workspace users.\n`)

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const gUser of googleUsers) {
    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url')
      .eq('email', gUser.email)
      .maybeSingle()

    if (lookupError) {
      console.error(`  Lookup error for ${gUser.email}:`, lookupError.message)
      errors++
      continue
    }

    if (!existing) {
      // New user — insert
      const { error } = await supabase.from('users').insert({
        email: gUser.email,
        first_name: gUser.firstName,
        last_name: gUser.lastName,
        avatar_url: gUser.avatarUrl,
      })
      if (error) {
        console.error(`  Insert error for ${gUser.email}:`, error.message)
        errors++
      } else {
        created++
      }
    } else {
      // Existing user — only fill in NULL fields
      const updates: Record<string, string> = {}
      if (!existing.first_name && gUser.firstName) updates.first_name = gUser.firstName
      if (!existing.last_name && gUser.lastName) updates.last_name = gUser.lastName
      if (!existing.avatar_url && gUser.avatarUrl) updates.avatar_url = gUser.avatarUrl

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', existing.id)
        if (error) {
          console.error(`  Update error for ${gUser.email}:`, error.message)
          errors++
        } else {
          updated++
        }
      } else {
        skipped++
      }
    }
  }

  console.log('--- Sync Summary ---')
  console.log(`  New users added:  ${created}`)
  console.log(`  Users updated:    ${updated}`)
  console.log(`  Already current:  ${skipped}`)
  console.log(`  Errors:           ${errors}`)
  console.log(`  Total processed:  ${googleUsers.length}`)

  if (errors > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
