import { createClient } from '@/lib/supabase/client'
import type { ComboboxOption } from '@/components/searchable-combobox'
import { toMemberOptions } from '@/lib/member-options'

export interface UserOption {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

// A single Supabase/PostgREST response is capped at ~1000 rows (db-max-rows),
// which silently truncates larger sets — the org already exceeds 1000 members,
// so anyone past ~#1000 alphabetically would be missing from pickers. Page
// through with .range() (which caps page size, not total reachable rows).
export const USER_PAGE_SIZE = 1000

/**
 * Fetch all users who have completed onboarding (for Amir selection)
 */
export async function fetchCompletedUsers(): Promise<{
  data: UserOption[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const rows: UserOption[] = []
    for (let from = 0; ; from += USER_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .not('onboarding_completed_at', 'is', null)
        .order('first_name, last_name')
        .range(from, from + USER_PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching users:', error)
        return { data: null, error: error.message }
      }

      rows.push(...((data ?? []) as UserOption[]))
      if (!data || data.length < USER_PAGE_SIZE) break
    }

    return { data: rows, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    console.error('Users fetch error:', err)
    return { data: null, error: message }
  }
}

/**
 * Fetch all users for amir selection dropdowns
 * Returns sorted list with full names in ComboboxOption format; namesakes carry
 * a location (or email) description so they can be told apart
 */
export async function fetchAllUsersForSelection(): Promise<{
  data: ComboboxOption[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    type Row = {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      memberships: {
        status: string
        neighbor_nets: { name: string; subregions: { name: string } | null } | null
      }[]
    }
    const rows: Row[] = []
    for (let from = 0; ; from += USER_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('users')
        // Location is only used to tell namesakes apart (toMemberOptions).
        .select('id, first_name, last_name, email, memberships(status, neighbor_nets(name, subregions(name)))')
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true })
        .range(from, from + USER_PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching users for selection:', error)
        return { data: null, error: error.message }
      }

      rows.push(...((data ?? []) as unknown as Row[]))
      if (!data || data.length < USER_PAGE_SIZE) break
    }

    const options = toMemberOptions(
      rows.map((user) => {
        const nn = user.memberships?.find((m) => m.status === 'active')?.neighbor_nets
        return {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          subregion: nn?.subregions?.name ?? null,
          neighborNet: nn?.name ?? null,
        }
      }),
    )

    return { data: options, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    console.error('Users selection fetch error:', err)
    return { data: null, error: message }
  }
}
