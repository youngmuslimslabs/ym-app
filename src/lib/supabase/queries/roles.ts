import { createClient } from '@/lib/supabase/client'

export interface RoleType {
  id: string
  name: string
  code: string
  category: string
  scope_type: string
  description: string | null
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
      .select('id, name, code, category, scope_type, description')
      .order('name')

    if (error) {
      console.error('Error fetching role types:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
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
