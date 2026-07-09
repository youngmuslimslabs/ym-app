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
      .select('user_id, checked_in_at, users(first_name, last_name)')
      .eq('session_id', sessionId),
  ])

  if (signupsRes.error) return { entries: [], error: signupsRes.error.message }
  if (checkInsRes.error) return { entries: [], error: checkInsRes.error.message }

  // Supabase returns the embedded users row as either an object (one FK) or
  // an array depending on the relation; we narrow defensively.
  type EmbeddedUser =
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null
  type SignupRow = { user_id: string; users: EmbeddedUser }
  type CheckInRow = { user_id: string; checked_in_at: string; users: EmbeddedUser }

  const resolveName = (u: EmbeddedUser): string => {
    const row = Array.isArray(u) ? u[0] : u
    const first = row?.first_name ?? ''
    const last = row?.last_name ?? ''
    return `${first} ${last}`.trim() || 'Unknown attendee'
  }

  const entryMap = new Map<string, RosterEntry>()
  for (const row of (signupsRes.data ?? []) as SignupRow[]) {
    entryMap.set(row.user_id, {
      userId: row.user_id,
      name: resolveName(row.users),
      checkedInAt: null,
    })
  }
  // Merge check-ins: attach timestamp to signups, and include walk-ins
  // (checked in but never signed up) — they must still appear on the roster.
  for (const row of (checkInsRes.data ?? []) as CheckInRow[]) {
    const existing = entryMap.get(row.user_id)
    if (existing) {
      existing.checkedInAt = row.checked_in_at
    } else {
      entryMap.set(row.user_id, {
        userId: row.user_id,
        name: resolveName(row.users),
        checkedInAt: row.checked_in_at,
      })
    }
  }
  const entries: RosterEntry[] = Array.from(entryMap.values())

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
