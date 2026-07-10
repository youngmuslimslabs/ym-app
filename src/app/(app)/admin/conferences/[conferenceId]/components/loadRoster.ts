import { createClient } from '@/lib/supabase/client'
import { resolveEmbeddedName, type EmbeddedUserName } from '@/lib/name'

export interface RosterEntry {
  userId: string
  name: string
  checkedInAt: string | null
  isWalkIn: boolean
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
      .select('user_id, users(first_name, last_name)')
      .eq('session_id', sessionId),
    supabase
      .from('session_check_ins')
      .select('user_id, checked_in_at, users(first_name, last_name)')
      .eq('session_id', sessionId),
  ])

  if (signupsRes.error) return { entries: [], error: signupsRes.error.message }
  if (checkInsRes.error) return { entries: [], error: checkInsRes.error.message }

  type Embedded = EmbeddedUserName | EmbeddedUserName[] | null
  type SignupRow = { user_id: string; users: Embedded }
  type CheckInRow = { user_id: string; checked_in_at: string; users: Embedded }

  const entryMap = new Map<string, RosterEntry>()
  for (const row of (signupsRes.data ?? []) as SignupRow[]) {
    entryMap.set(row.user_id, {
      userId: row.user_id,
      name: resolveEmbeddedName(row.users),
      checkedInAt: null,
      isWalkIn: false,
    })
  }
  for (const row of (checkInsRes.data ?? []) as CheckInRow[]) {
    const existing = entryMap.get(row.user_id)
    if (existing) {
      existing.checkedInAt = row.checked_in_at
    } else {
      entryMap.set(row.user_id, {
        userId: row.user_id,
        name: resolveEmbeddedName(row.users),
        checkedInAt: row.checked_in_at,
        isWalkIn: true,
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
