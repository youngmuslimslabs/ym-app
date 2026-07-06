import { createClient } from '@supabase/supabase-js'
import { normalizeEmail } from '@/lib/email'
import type { Database } from '@/types/database.types'

/**
 * Links a freshly-authenticated `auth.users` identity to a pre-provisioned
 * `public.users` row (matched by email) when that row has no `auth_id` yet.
 *
 * Why this exists: the `on_auth_user_created` trigger only links on a user's
 * FIRST-EVER `auth.users` insert. A returning user whose `public.users` row was
 * (re)created without an `auth_id` — e.g. after a users-table rebuild — never
 * re-fires that trigger, so every onboarding write fails. This self-heals the
 * row on the next authenticated request.
 *
 * Why service-role: RLS on `users` is `UPDATE ... USING (auth_id = auth.uid())`.
 * A row with `auth_id IS NULL` can never satisfy that, so the user's own client
 * silently updates 0 rows. Only the service_role key (which bypasses RLS) can
 * perform the link. MUST stay server-side — never import into client code.
 *
 * Safety: matches an exact, lowercased email AND `auth_id IS NULL`, so it never
 * hijacks an already-claimed account; `email` is unique, so it affects at most
 * one row.
 */
export async function claimUserByEmail(
  authId: string,
  email: string,
): Promise<{ claimed: boolean; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return { claimed: false, error: 'missing_service_credentials' }
  }

  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin
    .from('users')
    .update({ auth_id: authId, claimed_at: new Date().toISOString() })
    .eq('email', normalizeEmail(email))
    .is('auth_id', null)
    .select('id')

  if (error) {
    return { claimed: false, error: error.message }
  }
  return { claimed: (data?.length ?? 0) > 0 }
}
