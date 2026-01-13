import { createClient } from '@/lib/supabase/client'

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
