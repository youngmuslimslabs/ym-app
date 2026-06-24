import { createClient } from '@/lib/supabase/client'

export interface RoleType {
  id: string
  name: string
  code: string
  category: string
  scope_type: string
  description: string | null
  sort_order: number
}

/**
 * Fetch all role types from the database
 */
export async function fetchRoleTypes(): Promise<{
  data: RoleType[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('role_types')
      .select('id, name, code, category, scope_type, description, sort_order')
      .order('sort_order')

    if (error) {
      console.error('Error fetching role types:', error)
      return { data: null, error: error.message }
    }

    // Defense-in-depth UX guard: never surface system-category roles (e.g.
    // event_admin) in the onboarding/profile pickers. A user must not be able
    // to self-assign Event Admin. The hard security boundary is the
    // role_assignments RLS WITH CHECK in migration 00016; this keeps the role
    // out of the picker so it isn't offered in the first place.
    const filtered = data?.filter((rt) => rt.category !== 'system') ?? null

    return { data: filtered, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch role types'
    console.error('Role types fetch error:', err)
    return { data: null, error: message }
  }
}

/**
 * Get role type UUID by code
 */
export function getRoleTypeIdByCode(roleTypes: RoleType[], code: string): string | null {
  const roleType = roleTypes.find(rt => rt.code === code)
  return roleType?.id || null
}
