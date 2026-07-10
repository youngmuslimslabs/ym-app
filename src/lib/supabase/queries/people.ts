import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

// Type aliases for cleaner code
type Tables = Database['public']['Tables']
type RoleTypeRow = Tables['role_types']['Row']
type NeighborNetRow = Tables['neighbor_nets']['Row']
type SubregionRow = Tables['subregions']['Row']
type RegionRow = Tables['regions']['Row']

export interface PersonListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  region: { id: string; name: string } | null
  subregion: { id: string; name: string } | null
  neighborNet: { id: string; name: string } | null
  roles: { id: string; name: string; category: string }[]
  skills: string[]
  yearsInYM?: number
  isClaimed: boolean
}

export interface FilterOption {
  id: string
  name: string
}

export interface FilterCategories {
  regions: FilterOption[]
  subregions: FilterOption[]
  neighborNets: FilterOption[]
  roles: FilterOption[]
  skills: FilterOption[]
}

/**
 * Page through a Supabase query with .range() so results aren't silently capped
 * at ~1000 rows (PostgREST db-max-rows). Returns everything fetched plus the
 * first error encountered (if any).
 */
async function fetchAllPaged<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[]; error: string | null }> {
  const PAGE = 1000
  const all: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) return { data: all, error: error.message }
    all.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return { data: all, error: null }
}

/**
 * Fetch all people for the directory with their roles and geographic info
 */
export async function fetchPeopleForDirectory(): Promise<PersonListItem[]> {
  const supabase = await createClient()

  // Page through so the directory isn't silently truncated at 1000 members.
  const { data: users, error: usersError } = await fetchAllPaged((from, to) =>
    supabase
      .from('users')
      .select('*')
      .order('claimed_at', { ascending: false, nullsFirst: false })
      .range(from, to),
  )

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return []
  }

  if (users.length === 0) {
    return []
  }

  // Fetch ALL active roles + memberships (paged), then join client-side. We drop
  // the per-user .in() filter — with 1800+ ids it exceeds the request URL limit,
  // and we want every user's rows for the directory anyway.
  const [
    { data: roleAssignments, error: rolesError },
    { data: memberships, error: membershipsError },
  ] = await Promise.all([
    fetchAllPaged((from, to) =>
      supabase
        .from('role_assignments')
        .select(`*, role_types (*)`)
        .eq('is_active', true)
        .range(from, to),
    ),
    fetchAllPaged((from, to) =>
      supabase
        .from('memberships')
        .select(`*, neighbor_nets ( *, subregions ( *, regions (*) ) )`)
        .eq('status', 'active')
        .range(from, to),
    ),
  ])

  if (rolesError) {
    console.error('Error fetching role assignments:', rolesError)
  }
  if (membershipsError) {
    console.error('Error fetching memberships:', membershipsError)
  }

  // Build the PersonListItem array
  return users.map((user) => {
    const userMembership = memberships?.find((m) => m.user_id === user.id)
    const userRoles = roleAssignments?.filter((ra) => ra.user_id === user.id) || []

    // Extract geographic info from membership
    const nn = userMembership?.neighbor_nets as (NeighborNetRow & {
      subregions: SubregionRow & { regions: RegionRow }
    }) | null

    const neighborNet = nn ? { id: nn.id, name: nn.name } : null
    const subregion = nn?.subregions ? { id: nn.subregions.id, name: nn.subregions.name } : null
    const region = nn?.subregions?.regions ? { id: nn.subregions.regions.id, name: nn.subregions.regions.name } : null

    // Calculate years in YM
    let yearsInYM: number | undefined
    if (userMembership?.joined_at) {
      const joinedYear = new Date(userMembership.joined_at).getFullYear()
      yearsInYM = new Date().getFullYear() - joinedYear
    }

    // Map roles
    const roles = userRoles.map((ra) => {
      const roleType = ra.role_types as RoleTypeRow | null
      return {
        id: roleType?.id || ra.id,
        name: roleType?.name || ra.role_type_custom || 'Unknown Role',
        category: roleType?.category || 'other',
      }
    })

    return {
      id: user.id,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email,
      avatarUrl: user.avatar_url || undefined,
      region,
      subregion,
      neighborNet,
      roles,
      skills: user.skills || [],
      yearsInYM,
      isClaimed: user.claimed_at !== null,
    }
  })
}

/**
 * Fetch filter options from database
 */
export async function fetchFilterCategories(): Promise<FilterCategories> {
  const supabase = await createClient()

  const [regionsRes, subregionsRes, neighborNetsRes, roleTypesRes, usersSkillsRes] = await Promise.all([
    supabase.from('regions').select('id, name').eq('is_active', true).order('name'),
    supabase.from('subregions').select('id, name').eq('is_active', true).order('name'),
    supabase.from('neighbor_nets').select('id, name').eq('is_active', true).order('name'),
    supabase.from('role_types').select('id, name').order('sort_order'),
    // Paged so the skills facet reflects every member, not just the first 1000.
    fetchAllPaged((from, to) =>
      supabase.from('users').select('skills').not('onboarding_completed_at', 'is', null).range(from, to),
    ),
  ])

  // Log any errors from filter queries
  if (regionsRes.error) console.error('Error fetching regions:', regionsRes.error)
  if (subregionsRes.error) console.error('Error fetching subregions:', subregionsRes.error)
  if (neighborNetsRes.error) console.error('Error fetching neighbor_nets:', neighborNetsRes.error)
  if (roleTypesRes.error) console.error('Error fetching role_types:', roleTypesRes.error)
  if (usersSkillsRes.error) console.error('Error fetching user skills:', usersSkillsRes.error)

  // Build unique skills list
  const skillSet = new Set<string>()
  usersSkillsRes.data?.forEach((u) => {
    u.skills?.forEach((skill) => skillSet.add(skill))
  })
  const skills = Array.from(skillSet)
    .sort()
    .map((s) => ({ id: s.toLowerCase().replace(/\s+/g, '-'), name: s }))

  return {
    regions: regionsRes.data || [],
    subregions: subregionsRes.data || [],
    neighborNets: neighborNetsRes.data || [],
    roles: roleTypesRes.data || [],
    skills,
  }
}
