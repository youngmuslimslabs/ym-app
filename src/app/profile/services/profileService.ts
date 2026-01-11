'use client'

import { createClient } from '@/lib/supabase/client'
import type { ProfileFormState } from '../hooks/useProfileForm'
import type { EducationJson } from '@/types/supabase'

interface SaveProfileResult {
  success: boolean
  error?: string
}

// Transform form education entries to DB format
function transformEducationToDb(education: ProfileFormState['education']): EducationJson[] {
  if (!education) return []
  return education.map((edu) => ({
    school_name: edu.schoolName,
    school_custom: edu.schoolCustom,
    degree_type: edu.degreeType,
    field_of_study: edu.fieldOfStudy,
    graduation_year: edu.graduationYear,
  }))
}

// Helper to convert month/year to date string
function toDateString(month?: number, year?: number): string | null {
  if (!month || !year) return null
  // Use first day of the month
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export async function saveProfile(formData: ProfileFormState): Promise<SaveProfileResult> {
  try {
    const supabase = createClient()

    // Get current authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', authUser.id)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User profile not found' }
    }

    const userId = user.id

    // Update basic user fields
    const { error: updateError } = await supabase
      .from('users')
      .update({
        phone: formData.phoneNumber || null,
        personal_email: formData.personalEmail || null,
        ethnicity: formData.ethnicity || null,
        date_of_birth: formData.dateOfBirth
          ? `${formData.dateOfBirth.getFullYear()}-${String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(formData.dateOfBirth.getDate()).padStart(2, '0')}`
          : null,
        education_level: formData.educationLevel || null,
        education: transformEducationToDb(formData.education),
        skills: formData.skills ?? [],
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return { success: false, error: `Failed to save profile: ${updateError.message}` }
    }

    // Handle role assignments - use upsert to prevent data loss
    // Fetch existing role IDs to determine what to delete
    const { data: existingRoles, error: fetchRolesError } = await supabase
      .from('role_assignments')
      .select('id')
      .eq('user_id', userId)

    if (fetchRolesError) {
      console.error('Error fetching existing roles:', fetchRolesError)
      return { success: false, error: `Failed to fetch existing roles: ${fetchRolesError.message}` }
    }

    const existingRoleIds = new Set(existingRoles?.map(r => r.id) || [])

    if (formData.ymRoles && formData.ymRoles.length > 0) {
      // Upsert role assignments (insert new or update existing)
      const roleUpserts = formData.ymRoles.map((role) => ({
        id: role.id, // Preserve existing ID or use client-generated UUID
        user_id: userId,
        role_type_id: role.roleTypeId || null,
        role_type_custom: role.roleTypeCustom || null,
        amir_user_id: role.amirUserId || null,
        amir_custom_name: role.amirCustomName || null,
        start_date: toDateString(role.startMonth, role.startYear),
        end_date: role.isCurrent ? null : toDateString(role.endMonth, role.endYear),
        is_active: role.isCurrent,
        notes: role.description || null,
      }))

      const { error: upsertRolesError } = await supabase
        .from('role_assignments')
        .upsert(roleUpserts, { onConflict: 'id' })

      if (upsertRolesError) {
        console.error('Error upserting roles:', upsertRolesError)
        return { success: false, error: `Failed to save roles: ${upsertRolesError.message}` }
      }

      // Delete roles that were removed (in DB but not in form)
      const currentRoleIds = new Set(formData.ymRoles.map(r => r.id))
      const rolesToDelete = [...existingRoleIds].filter(id => !currentRoleIds.has(id))

      if (rolesToDelete.length > 0) {
        const { error: deleteRolesError } = await supabase
          .from('role_assignments')
          .delete()
          .in('id', rolesToDelete)

        if (deleteRolesError) {
          console.error('Error deleting removed roles:', deleteRolesError)
          // Don't fail the whole operation if delete fails
        }
      }
    } else {
      // No roles - delete all existing
      const { error: deleteAllRolesError } = await supabase
        .from('role_assignments')
        .delete()
        .eq('user_id', userId)

      if (deleteAllRolesError) {
        console.error('Error deleting all roles:', deleteAllRolesError)
        return { success: false, error: `Failed to delete roles: ${deleteAllRolesError.message}` }
      }
    }

    // Handle user projects - use upsert to prevent data loss
    // Fetch existing project IDs to determine what to delete
    const { data: existingProjects, error: fetchProjectsError } = await supabase
      .from('user_projects')
      .select('id')
      .eq('user_id', userId)

    if (fetchProjectsError) {
      console.error('Error fetching existing projects:', fetchProjectsError)
      return { success: false, error: `Failed to fetch existing projects: ${fetchProjectsError.message}` }
    }

    const existingProjectIds = new Set(existingProjects?.map(p => p.id) || [])

    if (formData.ymProjects && formData.ymProjects.length > 0) {
      // Upsert user projects (insert new or update existing)
      const projectUpserts = formData.ymProjects.map((project) => ({
        id: project.id, // Preserve existing ID or use client-generated UUID
        user_id: userId,
        project_type: project.projectType || null,
        project_type_custom: project.projectTypeCustom || null,
        role: project.role || null,
        description: project.description || null,
        amir_user_id: project.amirUserId || null,
        amir_custom_name: project.amirCustomName || null,
        start_month: project.startMonth || null,
        start_year: project.startYear || null,
        end_month: project.isCurrent ? null : (project.endMonth || null),
        end_year: project.isCurrent ? null : (project.endYear || null),
        is_current: project.isCurrent,
      }))

      const { error: upsertProjectsError } = await supabase
        .from('user_projects')
        .upsert(projectUpserts, { onConflict: 'id' })

      if (upsertProjectsError) {
        console.error('Error upserting projects:', upsertProjectsError)
        return { success: false, error: `Failed to save projects: ${upsertProjectsError.message}` }
      }

      // Delete projects that were removed (in DB but not in form)
      const currentProjectIds = new Set(formData.ymProjects.map(p => p.id))
      const projectsToDelete = [...existingProjectIds].filter(id => !currentProjectIds.has(id))

      if (projectsToDelete.length > 0) {
        const { error: deleteProjectsError } = await supabase
          .from('user_projects')
          .delete()
          .in('id', projectsToDelete)

        if (deleteProjectsError) {
          console.error('Error deleting removed projects:', deleteProjectsError)
          // Don't fail the whole operation if delete fails
        }
      }
    } else {
      // No projects - delete all existing
      const { error: deleteAllProjectsError } = await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', userId)

      if (deleteAllProjectsError) {
        console.error('Error deleting all projects:', deleteAllProjectsError)
        return { success: false, error: `Failed to delete projects: ${deleteAllProjectsError.message}` }
      }
    }

    // Handle membership (neighbor_net / subregion)
    if (formData.neighborNetId) {
      // Check if there's an existing active membership
      const { data: existingMembership, error: fetchMembershipError } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()

      if (fetchMembershipError) {
        console.error('Error fetching membership:', fetchMembershipError)
        return { success: false, error: `Failed to save membership: ${fetchMembershipError.message}` }
      }

      if (existingMembership) {
        // Update existing membership
        const { error: updateMembershipError } = await supabase
          .from('memberships')
          .update({ neighbor_net_id: formData.neighborNetId })
          .eq('id', existingMembership.id)

        if (updateMembershipError) {
          console.error('Error updating membership:', updateMembershipError)
          return { success: false, error: `Failed to update membership: ${updateMembershipError.message}` }
        }
      } else {
        // Create new membership
        const { error: insertMembershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            neighbor_net_id: formData.neighborNetId,
            status: 'active',
          })

        if (insertMembershipError) {
          console.error('Error creating membership:', insertMembershipError)
          return { success: false, error: `Failed to create membership: ${insertMembershipError.message}` }
        }
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save profile'
    console.error('Profile save error:', err)
    return { success: false, error: message }
  }
}
