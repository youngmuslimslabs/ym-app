import { createClient } from '@/lib/supabase/client'
import type { ComboboxOption } from '@/components/searchable-combobox'

export interface UserOption {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
}

/**
 * Fetch all users who have completed onboarding (for Amir selection)
 */
export async function fetchCompletedUsers(): Promise<{
  data: UserOption[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .not('onboarding_completed_at', 'is', null)
      .order('first_name, last_name')

    if (error) {
      console.error('Error fetching users:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
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

    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching users for selection:', error)
      return { data: null, error: error.message }
    }

    const options: ComboboxOption[] = data.map(user => ({
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
