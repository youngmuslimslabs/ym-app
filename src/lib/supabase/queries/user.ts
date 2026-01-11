import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
type RoleTypeRow = Tables['role_types']['Row']

export interface UserContext {
  name: string
  roles: string[]
  neighborNetName: string | null
  subregionName: string | null
  yearJoined: number | null
}

/**
 * Fetch the current user's context for the home page
 */
export async function fetchUserContext(userId: string): Promise<UserContext | null> {
  const supabase = await createClient()

  // Fetch user by auth_id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', userId)
    .single()

  if (userError || !user) {
    console.error('Error fetching user:', userError)
    return null
  }

  // Fetch active role assignments with role types
  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select(`
      *,
      role_types (*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  // Fetch active membership with geographic info
  const { data: membership } = await supabase
    .from('memberships')
    .select(`
      *,
      neighbor_nets (
        name,
        subregions (
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Build role names
  const roles = roleAssignments?.map((ra) => {
    const roleType = ra.role_types as RoleTypeRow | null
    return roleType?.name || ra.role_type_custom || 'Member'
  }) || []

  // Extract geographic info
  const nn = membership?.neighbor_nets as { name: string; subregions: { name: string } } | null
  const neighborNetName = nn?.name || null
  const subregionName = nn?.subregions?.name || null

  // Calculate year joined
  let yearJoined: number | null = null
  if (membership?.joined_at) {
    yearJoined = new Date(membership.joined_at).getFullYear()
  }

  return {
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Member',
    roles,
    neighborNetName,
    subregionName,
    yearJoined,
  }
}
