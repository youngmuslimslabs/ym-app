import { createClient } from '@/lib/supabase/client'
import type { ComboboxOption } from '@/components/searchable-combobox'

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
 * Returns sorted list with full names in ComboboxOption format
 */
export async function fetchAllUsersForSelection(): Promise<{
  data: ComboboxOption[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const rows: { id: string; first_name: string | null; last_name: string | null }[] = []
    for (let from = 0; ; from += USER_PAGE_SIZE) {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true })
        .range(from, from + USER_PAGE_SIZE - 1)

      if (error) {
        console.error('Error fetching users for selection:', error)
        return { data: null, error: error.message }
      }

      rows.push(...(data ?? []))
      if (!data || data.length < USER_PAGE_SIZE) break
    }

    const options: ComboboxOption[] = rows.map(user => ({
      value: user.id,
      label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
    }))

    return { data: options, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users'
    console.error('Users selection fetch error:', err)
    return { data: null, error: message }
  }
}
