import { createClient } from '@/lib/supabase/client'
import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'
import type { Tables } from '@/types/database.types'
import type { YMRoleEntry, YMProjectEntry, EducationEntry, EducationLevel } from '@/contexts/OnboardingContext'

// Type aliases for cleaner code
type RoleAssignment = Tables<'role_assignments'>
type UserProject = Tables<'user_projects'>

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

// Transform role assignments from DB to form format
function transformRoles(roles: RoleAssignment[]): YMRoleEntry[] {
  return roles.map((role) => {
    const startParsed = parseDateString(role.start_date)
    const endParsed = parseDateString(role.end_date)

    return {
      id: role.id,
      roleTypeId: role.role_type_id ?? undefined,
      roleTypeCustom: role.role_type_custom ?? undefined,
      amirUserId: role.amir_user_id ?? undefined,
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
function transformProjects(projects: UserProject[]): YMProjectEntry[] {
  return projects.map((project) => ({
    id: project.id,
    projectType: project.project_type ?? undefined,
    projectTypeCustom: project.project_type_custom ?? undefined,
    role: project.role ?? undefined,
    amirUserId: project.amir_user_id ?? undefined,
    amirCustomName: project.amir_custom_name ?? undefined,
    startMonth: project.start_month ?? undefined,
    startYear: project.start_year ?? undefined,
    endMonth: project.end_month ?? undefined,
    endYear: project.end_year ?? undefined,
    isCurrent: project.is_current,
    description: project.description ?? undefined,
  }))
}

// Transform education JSONB to form format
function transformEducation(education: EducationJson[]): EducationEntry[] {
  return education.map((edu, index) => ({
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
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_projects')
        .select('*')
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
      phoneNumber: user.phone ?? undefined,
      personalEmail: user.personal_email ?? undefined,
      ethnicity: user.ethnicity ?? undefined,
      dateOfBirth: parseDateToLocal(user.date_of_birth),
      subregionId,
      neighborNetId,
      ymRoles: transformRoles(rolesResult.data ?? []),
      ymProjects: transformProjects(projectsResult.data ?? []),
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
