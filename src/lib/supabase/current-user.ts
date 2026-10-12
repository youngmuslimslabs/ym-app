import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

// Request-scoped lookups for server components. React `cache()` dedupes these
// per render, so a page, its sections and its data loaders share one Auth check
// and one users-row read instead of each repeating the round-trips.

// Verified with Supabase Auth (getUser, not getSession) — the session cookie
// alone isn't trusted in server code.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export interface CurrentUserRow {
  id: string
  first_name: string | null
  last_name: string | null
}

// The signed-in user's public.users row (auth_id → users.id), or null when
// signed out or not yet linked.
export const getCurrentUserRow = cache(async (): Promise<CurrentUserRow | null> => {
  const authUser = await getAuthUser()
  if (!authUser) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('auth_id', authUser.id)
    .maybeSingle()
  if (error) {
    console.error('getCurrentUserRow: users lookup failed', error)
    return null
  }
  return data
})
