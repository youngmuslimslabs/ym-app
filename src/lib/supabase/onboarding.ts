import { createClient } from './client'
import type {
  OnboardingData,
  YMRoleEntry,
  YMProjectEntry,
  EducationEntry,
  EducationLevel
} from '@/contexts/OnboardingContext'

// ============================================
// TYPES
// ============================================

interface UserRow {
  id: string
  phone: string | null
  personal_email: string | null
  ethnicity: string | null
  date_of_birth: string | null
  education_level: string | null
  education: EducationEntry[] | null
  skills: string[] | null
  onboarding_completed_at: string | null
}

interface MembershipRow {
  id: string
  neighbor_net_id: string | null
  neighbor_nets: {
    id: string
    subregion_id: string
  } | null
}

interface RoleAssignmentRow {
  id: string
  role_type_id: string | null
  role_type_custom: string | null
  amir_user_id: string | null
  amir_custom_name: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  notes: string | null
}

interface UserProjectRow {
  id: string
  project_type: string | null
  project_type_custom: string | null
  role: string | null
  amir_user_id: string | null
  amir_custom_name: string | null
  start_month: number | null
  start_year: number | null
  end_month: number | null
  end_year: number | null
  is_current: boolean
  description: string | null
}

/**
 * Helper to parse date string without timezone issues
 * Parses "YYYY-MM-DD" directly without Date constructor timezone shift
 */
function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10)
  }
}

/**
 * Creates a Date object from a date string, preserving the date as-is
 * Avoids timezone shift issues with new Date(string)
 */
function dateFromString(dateStr: string): Date {
  const parsed = parseDateString(dateStr)
  if (!parsed) return new Date(dateStr) // fallback
  // Use UTC to avoid timezone shifts, then we only care about the date parts
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
}

// ============================================
// FETCH EXISTING DATA
// ============================================

/**
 * Fetches all existing onboarding data for a user
 * Used to pre-fill the onboarding form
 */
export async function fetchOnboardingData(authId: string): Promise<{
  data: OnboardingData | null
  userId: string | null
  isComplete: boolean
  error?: string
}> {
  const supabase = createClient()

  try {
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone, personal_email, ethnicity, date_of_birth, education_level, education, skills, onboarding_completed_at')
      .eq('auth_id', authId)
      .single()

    if (userError || !user) {
      return { data: null, userId: null, isComplete: false, error: 'User not found' }
    }

    const typedUser = user as UserRow

    // Get active membership with neighbor_net info
    const { data: membership } = await supabase
      .from('memberships')
      .select('id, neighbor_net_id, neighbor_nets(id, subregion_id)')
      .eq('user_id', typedUser.id)
      .eq('status', 'active')
      .single()

    const typedMembership = membership as MembershipRow | null

    // Get role assignments
    const { data: roles } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('user_id', typedUser.id)
      .order('start_date', { ascending: false })

    const typedRoles = (roles || []) as RoleAssignmentRow[]

    // Get user projects
    const { data: projects } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', typedUser.id)
      .order('start_year', { ascending: false })

    const typedProjects = (projects || []) as UserProjectRow[]

    // Map database data to OnboardingData format
    const onboardingData: OnboardingData = {
      // Step 1: Personal Info
      phoneNumber: typedUser.phone || undefined,
      personalEmail: typedUser.personal_email || undefined,
      ethnicity: typedUser.ethnicity || undefined,
      dateOfBirth: typedUser.date_of_birth ? dateFromString(typedUser.date_of_birth) : undefined,

      // Step 2: Location
      subregionId: typedMembership?.neighbor_nets?.subregion_id || undefined,
      neighborNetId: typedMembership?.neighbor_net_id || undefined,

      // Step 3: YM Roles
      ymRoles: typedRoles.map((role): YMRoleEntry => {
        const startDate = role.start_date ? dateFromString(role.start_date) : null
        const endDate = role.end_date ? dateFromString(role.end_date) : null
        return {
          id: role.id,
          roleTypeId: role.role_type_id || undefined,
          roleTypeCustom: role.role_type_custom || undefined,
          amirUserId: role.amir_user_id || undefined,
          amirCustomName: role.amir_custom_name || undefined,
          startMonth: startDate ? startDate.getMonth() + 1 : undefined,
          startYear: startDate ? startDate.getFullYear() : undefined,
          endMonth: endDate ? endDate.getMonth() + 1 : undefined,
          endYear: endDate ? endDate.getFullYear() : undefined,
          isCurrent: role.is_active,
          description: role.notes || undefined
        }
      }),

      // Step 4: YM Projects
      ymProjects: typedProjects.map((project): YMProjectEntry => ({
        id: project.id,
        projectType: project.project_type || undefined,
        projectTypeCustom: project.project_type_custom || undefined,
        role: project.role || undefined,
        amirUserId: project.amir_user_id || undefined,
        amirCustomName: project.amir_custom_name || undefined,
        startMonth: project.start_month || undefined,
        startYear: project.start_year || undefined,
        endMonth: project.end_month || undefined,
        endYear: project.end_year || undefined,
        isCurrent: project.is_current,
        description: project.description || undefined
      })),

      // Step 5: Education
      educationLevel: typedUser.education_level as EducationLevel || undefined,
      education: typedUser.education || undefined,

      // Step 6: Skills
      skills: typedUser.skills || undefined
    }

    return {
      data: onboardingData,
      userId: typedUser.id,
      isComplete: typedUser.onboarding_completed_at !== null
    }
  } catch (error) {
    console.error('Error fetching onboarding data:', error)
    return { data: null, userId: null, isComplete: false, error: 'Failed to fetch data' }
  }
}

// ============================================
// PER-STEP SAVE FUNCTIONS
// ============================================

/**
 * Helper to get internal user ID from auth ID
 * Returns specific error messages to help with debugging
 */
async function getUserId(authId: string): Promise<{ id: string | null; error?: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single()

  if (error) {
    // PGRST116 = no rows returned
    if (error.code === 'PGRST116') {
      return { id: null, error: 'User not found' }
    }
    console.error('Database error in getUserId:', error)
    return { id: null, error: 'Database connection error' }
  }

  if (!data) {
    return { id: null, error: 'User not found' }
  }

  return { id: data.id }
}

/**
 * Save Step 1: Personal Info
 */
export async function saveStep1(authId: string, data: {
  phoneNumber?: string
  personalEmail?: string
  ethnicity?: string
  dateOfBirth?: Date
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  const { error } = await supabase
    .from('users')
    .update({
      phone: data.phoneNumber || null,
      personal_email: data.personalEmail || null,
      ethnicity: data.ethnicity || null,
      date_of_birth: data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : null
    })
    .eq('id', userId)

  if (error) {
    console.error('Error saving step 1:', error)
    return { success: false, error: 'Failed to save personal info' }
  }

  return { success: true }
}

/**
 * Save Step 2: Location (Membership)
 * Uses upsert pattern: update existing active membership or create new one
 */
export async function saveStep2(authId: string, data: {
  neighborNetId?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  if (!data.neighborNetId) {
    return { success: true } // No location to save
  }

  // Check for existing active membership
  const { data: existingMembership, error: fetchError } = await supabase
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching membership:', fetchError)
    return { success: false, error: 'Failed to check existing membership' }
  }

  if (existingMembership) {
    // Update existing membership
    const { error } = await supabase
      .from('memberships')
      .update({ neighbor_net_id: data.neighborNetId })
      .eq('id', existingMembership.id)

    if (error) {
      console.error('Error updating membership:', error)
      return { success: false, error: 'Failed to save location' }
    }
  } else {
    // Create new membership
    const { error } = await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        neighbor_net_id: data.neighborNetId,
        status: 'active',
        joined_at: new Date().toISOString().split('T')[0]
      })

    if (error) {
      console.error('Error creating membership:', error)
      return { success: false, error: 'Failed to save location' }
    }
  }

  return { success: true }
}

/**
 * Save Step 3: YM Roles
 * Uses insert-first-then-delete pattern to avoid data loss if insert fails
 */
export async function saveStep3(authId: string, data: {
  ymRoles?: YMRoleEntry[]
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  // Get existing role IDs before modifying
  const { data: existingRoles } = await supabase
    .from('role_assignments')
    .select('id')
    .eq('user_id', userId)

  const existingIds = (existingRoles || []).map(r => r.id)

  // If no new roles, just delete existing ones
  if (!data.ymRoles || data.ymRoles.length === 0) {
    if (existingIds.length > 0) {
      await supabase
        .from('role_assignments')
        .delete()
        .in('id', existingIds)
    }
    return { success: true }
  }

  // Helper to convert month/year to date string
  const toDateString = (month?: number, year?: number): string | null => {
    if (!month || !year) return null
    return `${year}-${String(month).padStart(2, '0')}-01`
  }

  const roleAssignments = data.ymRoles.map(role => ({
    user_id: userId,
    role_type_id: role.roleTypeId || null,
    role_type_custom: role.roleTypeCustom || null,
    amir_user_id: role.amirUserId || null,
    amir_custom_name: role.amirCustomName || null,
    start_date: toDateString(role.startMonth, role.startYear),
    end_date: role.isCurrent ? null : toDateString(role.endMonth, role.endYear),
    is_active: role.isCurrent,
    notes: role.description || null
  }))

  // Insert new records first
  const { error } = await supabase
    .from('role_assignments')
    .insert(roleAssignments)

  if (error) {
    console.error('Error saving step 3:', error)
    return { success: false, error: 'Failed to save roles' }
  }

  // Only delete old records after successful insert
  if (existingIds.length > 0) {
    await supabase
      .from('role_assignments')
      .delete()
      .in('id', existingIds)
  }

  return { success: true }
}

/**
 * Save Step 4: YM Projects
 * Uses insert-first-then-delete pattern to avoid data loss if insert fails
 */
export async function saveStep4(authId: string, data: {
  ymProjects?: YMProjectEntry[]
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  // Get existing project IDs before modifying
  const { data: existingProjects } = await supabase
    .from('user_projects')
    .select('id')
    .eq('user_id', userId)

  const existingIds = (existingProjects || []).map(p => p.id)

  // If no new projects, just delete existing ones
  if (!data.ymProjects || data.ymProjects.length === 0) {
    if (existingIds.length > 0) {
      await supabase
        .from('user_projects')
        .delete()
        .in('id', existingIds)
    }
    return { success: true }
  }

  const userProjects = data.ymProjects.map(project => ({
    user_id: userId,
    project_type: project.projectType || null,
    project_type_custom: project.projectTypeCustom || null,
    role: project.role || null,
    amir_user_id: project.amirUserId || null,
    amir_custom_name: project.amirCustomName || null,
    start_month: project.startMonth || null,
    start_year: project.startYear || null,
    end_month: project.isCurrent ? null : (project.endMonth || null),
    end_year: project.isCurrent ? null : (project.endYear || null),
    is_current: project.isCurrent,
    description: project.description || null
  }))

  // Insert new records first
  const { error } = await supabase
    .from('user_projects')
    .insert(userProjects)

  if (error) {
    console.error('Error saving step 4:', error)
    return { success: false, error: 'Failed to save projects' }
  }

  // Only delete old records after successful insert
  if (existingIds.length > 0) {
    await supabase
      .from('user_projects')
      .delete()
      .in('id', existingIds)
  }

  return { success: true }
}

/**
 * Save Step 5: Education
 */
export async function saveStep5(authId: string, data: {
  educationLevel?: EducationLevel
  education?: EducationEntry[]
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  const { error } = await supabase
    .from('users')
    .update({
      education_level: data.educationLevel || null,
      education: data.education || []
    })
    .eq('id', userId)

  if (error) {
    console.error('Error saving step 5:', error)
    return { success: false, error: 'Failed to save education' }
  }

  return { success: true }
}

/**
 * Save Step 6: Skills
 */
export async function saveStep6(authId: string, data: {
  skills?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  const { error } = await supabase
    .from('users')
    .update({
      skills: data.skills || []
    })
    .eq('id', userId)

  if (error) {
    console.error('Error saving step 6:', error)
    return { success: false, error: 'Failed to save skills' }
  }

  return { success: true }
}

/**
 * Mark onboarding as complete (Step 7)
 */
export async function completeOnboarding(authId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const userResult = await getUserId(authId)
  if (!userResult.id) return { success: false, error: userResult.error || 'User not found' }
  const userId = userResult.id

  const { error } = await supabase
    .from('users')
    .update({
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error completing onboarding:', error)
    return { success: false, error: 'Failed to complete onboarding' }
  }

  return { success: true }
}

// ============================================
// ONBOARDING STATUS CHECK
// ============================================

/**
 * Checks if a user has completed onboarding
 */
export async function checkOnboardingComplete(authId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('auth_id', authId)
    .single()

  if (error || !data) return false
  return data.onboarding_completed_at !== null
}

/**
 * Gets the first incomplete step for a user
 * Returns 0 if onboarding is complete, or 1-7 for the step needed
 */
export async function getIncompleteStep(authId: string): Promise<number> {
  const { data, isComplete } = await fetchOnboardingData(authId)

  if (isComplete) return 0
  if (!data) return 1

  // Step 1: Personal info - optional fields, always allow to proceed
  // Step 2: Location - required
  if (!data.neighborNetId) return 2

  // Steps 3-4: Roles and projects - optional
  // Step 5: Education level - required
  if (!data.educationLevel) return 5

  // Step 6: Skills - need at least 3
  if (!data.skills || data.skills.length < 3) return 6

  // All required fields complete, just need to finalize
  return 7
}
