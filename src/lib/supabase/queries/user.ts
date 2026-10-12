import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRow } from '@/lib/supabase/current-user'
import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
type RoleTypeRow = Tables['role_types']['Row']

export interface UserContext {
  name: string
  roles: string[]
  neighborNetName: string | null
  subregionName: string | null
}

/**
 * Fetch the current user's context for the home page
 */
export async function fetchUserContext(): Promise<UserContext | null> {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUserRow()])
  if (!user) return null

  // Fetch role assignments and membership in parallel (independent queries)
  const [{ data: roleAssignments }, { data: membership, error: membershipError }] = await Promise.all([
    supabase
      .from('role_assignments')
      .select(`
        *,
        role_types (*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
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
      .maybeSingle(),
  ])

  // Log non-PGRST116 errors (PGRST116 is "no rows found" which is expected)
  if (membershipError && membershipError.code !== 'PGRST116') {
    console.error('Error fetching membership:', membershipError)
  }

  // Build role names
  const roles = roleAssignments?.map((ra) => {
    const roleType = ra.role_types as RoleTypeRow | null
    return roleType?.name || ra.role_type_custom || 'Member'
  }) || []

  // Extract geographic info
  const nn = membership?.neighbor_nets as { name: string; subregions: { name: string } } | null
  const neighborNetName = nn?.name || null
  const subregionName = nn?.subregions?.name || null

  return {
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Member',
    roles,
    neighborNetName,
    subregionName,
  }
}
