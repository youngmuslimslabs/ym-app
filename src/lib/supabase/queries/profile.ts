import { createClient } from '@/lib/supabase/client'
import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'
import type { Tables } from '@/types/database.types'
import type { YMRoleEntry, YMProjectEntry, EducationEntry, EducationLevel } from '@/contexts/OnboardingContext'

// Type aliases for cleaner code
type RoleAssignment = Tables<'role_assignments'>
type UserProject = Tables<'user_projects'>
type AmirUser = { first_name: string | null; last_name: string | null }
type RoleAssignmentJoined = RoleAssignment & { role_types: { name: string } | null; amir_user: AmirUser | null }
type UserProjectJoined = UserProject & { amir_user: AmirUser | null }

// Education entry stored as JSONB in users table
interface EducationJson {
  school_name?: string
  school_custom?: string
  degree_type?: string
  field_of_study?: string
  graduation_year?: number
}

// Parse date string (YYYY-MM-DD) without timezone issues
function parseDateString(dateStr: string | null | undefined): { month: number; year: number } | null {
  if (!dateStr) return null
  const [yearStr, monthStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (isNaN(year) || isNaN(month)) return null
  return { month, year }
}

// Parse date string to Date object without timezone issues
function parseDateToLocal(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // JS months are 0-indexed
  const day = parseInt(dayStr, 10)
  if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined
  return new Date(year, month, day)
}

function formatAmirName(amir: AmirUser | null): string | undefined {
  if (!amir) return undefined
  const name = `${amir.first_name || ''} ${amir.last_name || ''}`.trim()
  return name || undefined
}

// Transform role assignments from DB to form format
function transformRoles(roles: RoleAssignmentJoined[]): YMRoleEntry[] {
  return roles.map((role) => {
    const startParsed = parseDateString(role.start_date)
    const endParsed = parseDateString(role.end_date)

    return {
      id: role.id,
      roleTypeId: role.role_type_id ?? undefined,
      roleTypeName: (role.role_types as { name: string } | null)?.name ?? undefined,
      roleTypeCustom: role.role_type_custom ?? undefined,
      amirUserId: role.amir_user_id ?? undefined,
      amirUserName: formatAmirName(role.amir_user as AmirUser | null),
      amirCustomName: role.amir_custom_name ?? undefined,
      startMonth: startParsed?.month,
      startYear: startParsed?.year,
      endMonth: endParsed?.month,
      endYear: endParsed?.year,
      isCurrent: role.is_active,
      description: role.notes ?? undefined,
    }
  })
}

// Transform user projects from DB to form format
function transformProjects(projects: UserProjectJoined[]): YMProjectEntry[] {
  return projects.map((project) => ({
    id: project.id,
    projectType: project.project_type ?? undefined,
    projectTypeCustom: project.project_type_custom ?? undefined,
    role: project.role ?? undefined,
    amirUserId: project.amir_user_id ?? undefined,
    amirUserName: formatAmirName(project.amir_user as AmirUser | null),
    amirCustomName: project.amir_custom_name ?? undefined,
    startMonth: project.start_month ?? undefined,
    startYear: project.start_year ?? undefined,
    endMonth: project.end_month ?? undefined,
    endYear: project.end_year ?? undefined,
    isCurrent: project.is_current,
    description: project.description ?? undefined,
  }))
}

// Transform education JSONB to form format, filtering out empty entries
function transformEducation(education: EducationJson[]): EducationEntry[] {
  return education
    .filter(edu => edu.school_name || edu.school_custom || edu.degree_type || edu.field_of_study || edu.graduation_year)
    .map((edu, index) => ({
      id: `edu-${index}`,
      schoolName: edu.school_name,
      schoolCustom: edu.school_custom,
      degreeType: edu.degree_type,
      fieldOfStudy: edu.field_of_study,
      graduationYear: edu.graduation_year,
    }))
}

/**
 * Fetch a user's full profile by their user ID
 * @param userId - The user's ID (not auth_id)
 * @returns Profile data and error state
 */
export async function fetchUserProfileById(userId: string): Promise<{
  data: ProfileFormState | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    // Fetch user profile by user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      // If no user found
      if (userError.code === 'PGRST116') {
        return { data: null, error: 'Profile not found' }
      }
      return { data: null, error: `Failed to fetch profile: ${userError.message}` }
    }

    // Fetch related data in parallel
    const [rolesResult, projectsResult, membershipResult] = await Promise.all([
      supabase
        .from('role_assignments')
        .select('*, role_types(name), amir_user:users!role_assignments_amir_user_id_fkey(first_name, last_name)')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_projects')
        .select('*, amir_user:users!user_projects_amir_user_id_fkey(first_name, last_name)')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false }),
      supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

    if (rolesResult.error) {
      console.error('Error fetching roles:', rolesResult.error)
    }
    if (projectsResult.error) {
      console.error('Error fetching projects:', projectsResult.error)
    }
    if (membershipResult.error) {
      console.error('Error fetching membership:', membershipResult.error)
    }

    // Get subregion from neighbor_net if membership exists
    let subregionId: string | undefined
    let neighborNetId: string | undefined

    if (membershipResult.data?.neighbor_net_id) {
      neighborNetId = membershipResult.data.neighbor_net_id

      // Fetch the subregion for this neighbor_net
      const { data: nn } = await supabase
        .from('neighbor_nets')
        .select('subregion_id')
        .eq('id', neighborNetId)
        .single()

      if (nn) {
        subregionId = nn.subregion_id
      }
    }

    // Transform database data to form state
    const formState: ProfileFormState = {
      googleEmail: user.email,
      firstName: user.first_name ?? undefined,
      lastName: user.last_name ?? undefined,
      avatarUrl: user.avatar_url ?? undefined,
      phoneNumber: user.phone ?? undefined,
      personalEmail: user.personal_email ?? undefined,
      ethnicity: user.ethnicity ?? undefined,
      dateOfBirth: parseDateToLocal(user.date_of_birth),
      subregionId,
      neighborNetId,
      ymRoles: transformRoles((rolesResult.data ?? []) as RoleAssignmentJoined[]),
      ymProjects: transformProjects((projectsResult.data ?? []) as UserProjectJoined[]),
      educationLevel: (user.education_level as EducationLevel) ?? undefined,
      education: transformEducation((user.education ?? []) as EducationJson[]),
      skills: user.skills ?? [],
    }

    return { data: formState, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch profile'
    console.error('Profile fetch error:', err)
    return { data: null, error: message }
  }
}

/**
 * Read the current user's `profile_completed_at` flag — the durable, skip-safe
 * signal the feature gates use for "profile complete". Lightweight (one column),
 * separate from the full profile fetch so it doesn't touch the save path.
 * Returns null when not set / not authenticated / on error (fail-closed).
 */
export async function fetchProfileCompletedAt(): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null
    const { data } = await supabase
      .from('users')
      .select('profile_completed_at')
      .eq('auth_id', authUser.id)
      .maybeSingle()
    return data?.profile_completed_at ?? null
  } catch {
    return null
  }
}

/**
 * Set `profile_completed_at = now()` for the current user — flips the profile
 * from gated to complete. Idempotent; call after the Part-2 sections are saved.
 */
export async function markProfileComplete(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase
      .from('users')
      .update({ profile_completed_at: new Date().toISOString() })
      .eq('auth_id', authUser.id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to mark complete' }
  }
}

/**
 * Fetch the current authenticated user's profile
 * @returns Profile data and error state
 */
export async function fetchCurrentUserProfile(): Promise<{
  data: ProfileFormState | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    // Get current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: `Authentication error: ${authError.message}` }
    }

    if (!authUser) {
      return { data: null, error: 'Not authenticated' }
    }

    // Fetch user profile by auth_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single()

    if (userError) {
      // If no user found, they may not be in the users table yet
      if (userError.code === 'PGRST116') {
        return { data: null, error: 'Profile not found. Please complete onboarding.' }
      }
      return { data: null, error: `Failed to fetch profile: ${userError.message}` }
    }

    // Use the shared function to get the full profile
    return await fetchUserProfileById(user.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch profile'
    console.error('Profile fetch error:', err)
    return { data: null, error: message }
  }
}
