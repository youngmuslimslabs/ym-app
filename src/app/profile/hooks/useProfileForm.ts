'use client'

import { useState, useCallback, useMemo } from 'react'
import type {
  OnboardingData,
  YMRoleEntry,
  YMProjectEntry,
  EducationEntry,
} from '@/contexts/OnboardingContext'
import { saveProfile } from '../services/profileService'

export interface ProfileFormState extends OnboardingData {
  // Google auth email (read-only)
  googleEmail?: string
  // Display name fields (read-only for viewing profiles)
  firstName?: string
  lastName?: string
}

interface UseProfileFormReturn {
  formData: ProfileFormState
  originalData: ProfileFormState
  hasChanges: boolean
  changeCount: number
  isSaving: boolean
  saveError: string | null
  updateField: <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => void
  updateRole: (index: number, updates: Partial<YMRoleEntry>) => void
  addRole: () => void
  removeRole: (index: number) => void
  updateProject: (index: number, updates: Partial<YMProjectEntry>) => void
  addProject: () => void
  removeProject: (index: number) => void
  updateEducation: (index: number, updates: Partial<EducationEntry>) => void
  addEducation: () => void
  removeEducation: (index: number) => void
  toggleSkill: (skillId: string) => void
  resetForm: () => void
  saveForm: () => Promise<{ success: boolean; error?: string }>
  setInitialData: (data: ProfileFormState) => void
}

// Helper to create empty entries
function createEmptyRole(): YMRoleEntry {
  return { id: crypto.randomUUID(), isCurrent: false }
}

function createEmptyProject(): YMProjectEntry {
  return { id: crypto.randomUUID(), isCurrent: false }
}

function createEmptyEducation(): EducationEntry {
  return { id: crypto.randomUUID() }
}

// Deep comparison for change detection
function hasDeepChanges(original: ProfileFormState, current: ProfileFormState): boolean {
  return JSON.stringify(original) !== JSON.stringify(current)
}

function countChanges(original: ProfileFormState, current: ProfileFormState): number {
  let count = 0

  // Simple fields
  const simpleFields: (keyof ProfileFormState)[] = [
    'phoneNumber', 'personalEmail', 'ethnicity', 'dateOfBirth',
    'subregionId', 'neighborNetId', 'educationLevel'
  ]

  for (const field of simpleFields) {
    if (JSON.stringify(original[field]) !== JSON.stringify(current[field])) {
      count++
    }
  }

  // Array fields - count as single change per section if different
  if (JSON.stringify(original.ymRoles) !== JSON.stringify(current.ymRoles)) count++
  if (JSON.stringify(original.ymProjects) !== JSON.stringify(current.ymProjects)) count++
  if (JSON.stringify(original.education) !== JSON.stringify(current.education)) count++
  if (JSON.stringify(original.skills) !== JSON.stringify(current.skills)) count++

  return count
}

export function useProfileForm(initialData: ProfileFormState): UseProfileFormReturn {
  const [originalData, setOriginalData] = useState<ProfileFormState>(initialData)
  const [formData, setFormData] = useState<ProfileFormState>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const hasChanges = useMemo(
    () => hasDeepChanges(originalData, formData),
    [originalData, formData]
  )

  const changeCount = useMemo(
    () => countChanges(originalData, formData),
    [originalData, formData]
  )

  const updateField = useCallback(<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  // YM Roles
  const updateRole = useCallback((index: number, updates: Partial<YMRoleEntry>) => {
    setFormData(prev => ({
      ...prev,
      ymRoles: prev.ymRoles?.map((role, i) =>
        i === index ? { ...role, ...updates } : role
      ) ?? []
    }))
  }, [])

  const addRole = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ymRoles: [...(prev.ymRoles ?? []), createEmptyRole()]
    }))
  }, [])

  const removeRole = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ymRoles: prev.ymRoles?.filter((_, i) => i !== index) ?? []
    }))
  }, [])

  // YM Projects
  const updateProject = useCallback((index: number, updates: Partial<YMProjectEntry>) => {
    setFormData(prev => ({
      ...prev,
      ymProjects: prev.ymProjects?.map((project, i) =>
        i === index ? { ...project, ...updates } : project
      ) ?? []
    }))
  }, [])

  const addProject = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ymProjects: [...(prev.ymProjects ?? []), createEmptyProject()]
    }))
  }, [])

  const removeProject = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ymProjects: prev.ymProjects?.filter((_, i) => i !== index) ?? []
    }))
  }, [])

  // Education
  const updateEducation = useCallback((index: number, updates: Partial<EducationEntry>) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.map((edu, i) =>
        i === index ? { ...edu, ...updates } : edu
      ) ?? []
    }))
  }, [])

  const addEducation = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education ?? []), createEmptyEducation()]
    }))
  }, [])

  const removeEducation = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index) ?? []
    }))
  }, [])

  // Skills
  const toggleSkill = useCallback((skillId: string) => {
    setFormData(prev => {
      const currentSkills = prev.skills ?? []
      const newSkills = currentSkills.includes(skillId)
        ? currentSkills.filter(id => id !== skillId)
        : [...currentSkills, skillId]
      return { ...prev, skills: newSkills }
    })
  }, [])

  const resetForm = useCallback(() => {
    setFormData(originalData)
  }, [originalData])

  const setInitialData = useCallback((data: ProfileFormState) => {
    setOriginalData(data)
    setFormData(data)
  }, [])

  const saveForm = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsSaving(true)
    setSaveError(null)

    const result = await saveProfile(formData)

    setIsSaving(false)

    if (result.success) {
      // After successful save, update originalData so hasChanges becomes false
      setOriginalData(formData)
      return { success: true }
    } else {
      setSaveError(result.error ?? 'Failed to save profile')
      return { success: false, error: result.error }
    }
  }, [formData])

  return {
    formData,
    originalData,
    hasChanges,
    changeCount,
    isSaving,
    saveError,
    updateField,
    updateRole,
    addRole,
    removeRole,
    updateProject,
    addProject,
    removeProject,
    updateEducation,
    addEducation,
    removeEducation,
    toggleSkill,
    resetForm,
    saveForm,
    setInitialData,
  }
}
