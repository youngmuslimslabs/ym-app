import { createClient } from '@/lib/supabase/client'

export interface RosterEntry {
  userId: string
  name: string
  checkedInAt: string | null
}

// Data fetch — runs in the browser via the public Supabase client. RLS gates
// access (see migration 00013): admins read all signups + check-ins. Two
// parallel queries keyed on session_id, merged on user_id. Names resolve at
// the query level via the embedded users(...) — never a second client lookup.
export async function loadRoster(
  sessionId: string
): Promise<{ entries: RosterEntry[]; error: null } | { entries: []; error: string }> {
  const supabase = createClient()
  const [signupsRes, checkInsRes] = await Promise.all([
    supabase
      .from('session_signups')
      .select('user_id, created_at, users(first_name, last_name)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true }),
    supabase
      .from('session_check_ins')
      .select('user_id, checked_in_at')
      .eq('session_id', sessionId),
  ])

  if (signupsRes.error) return { entries: [], error: signupsRes.error.message }
  if (checkInsRes.error) return { entries: [], error: checkInsRes.error.message }

  const checkInMap = new Map<string, string>()
  for (const c of (checkInsRes.data ?? []) as {
    user_id: string
    checked_in_at: string
  }[]) {
    checkInMap.set(c.user_id, c.checked_in_at)
  }

  // Supabase returns the embedded users row as either an object (one FK) or
  // an array depending on the relation; we narrow defensively.
  type SignupRow = {
    user_id: string
    users:
      | { first_name: string | null; last_name: string | null }
      | { first_name: string | null; last_name: string | null }[]
      | null
  }
  const entries: RosterEntry[] = ((signupsRes.data ?? []) as SignupRow[]).map(
    (row) => {
      const u = Array.isArray(row.users) ? row.users[0] : row.users
      const first = u?.first_name ?? ''
      const last = u?.last_name ?? ''
      const name = `${first} ${last}`.trim() || 'Unknown attendee'
      return {
        userId: row.user_id,
        name,
        checkedInAt: checkInMap.get(row.user_id) ?? null,
      }
    }
  )

  // Stable order: checked-in first by time, then everyone else by name.
  entries.sort((a, b) => {
    if (a.checkedInAt && b.checkedInAt) {
      return a.checkedInAt.localeCompare(b.checkedInAt)
    }
    if (a.checkedInAt && !b.checkedInAt) return -1
    if (!a.checkedInAt && b.checkedInAt) return 1
    return a.name.localeCompare(b.name)
  })

  return { entries, error: null }
}
