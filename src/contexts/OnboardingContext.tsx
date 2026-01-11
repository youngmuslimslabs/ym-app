'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  fetchOnboardingData,
  saveStep1,
  saveStep2,
  saveStep3,
  saveStep4,
  saveStep5,
  saveStep6,
  completeOnboarding as completeOnboardingApi
} from '@/lib/supabase/onboarding'

// Entry type for YM Roles (Step 3)
export interface YMRoleEntry {
  id: string
  roleTypeId?: string
  roleTypeCustom?: string
  amirUserId?: string
  amirCustomName?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent: boolean
  description?: string
}

// Entry type for YM Projects (Step 4)
export interface YMProjectEntry {
  id: string
  projectType?: string
  projectTypeCustom?: string
  role?: string
  amirUserId?: string
  amirCustomName?: string
  startMonth?: number
  startYear?: number
  endMonth?: number
  endYear?: number
  isCurrent: boolean
  description?: string
}

// Education level options (Step 5)
export type EducationLevel =
  | 'high-school-current'    // Currently in high school
  | 'high-school-graduate'   // High school graduate, no college
  | 'college'                // College (current or completed)

// Entry type for Education (Step 5)
export interface EducationEntry {
  id: string
  schoolName?: string
  schoolCustom?: string
  degreeType?: string
  fieldOfStudy?: string
  graduationYear?: number
}

// Onboarding form data collected across all steps
export interface OnboardingData {
  // Step 1: Personal Info
  phoneNumber?: string
  personalEmail?: string
  ethnicity?: string
  dateOfBirth?: Date

  // Step 2: Location
  subregionId?: string
  neighborNetId?: string

  // Step 3: YM Roles
  ymRoles?: YMRoleEntry[]

  // Step 4: YM Projects
  ymProjects?: YMProjectEntry[]

  // Step 5: Education
  educationLevel?: EducationLevel
  education?: EducationEntry[]

  // Step 6: Skills
  skills?: string[]
}

interface SaveResult {
  success: boolean
  error?: string
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  clearData: () => void
  // Loading states
  isLoading: boolean
  isSaving: boolean
  // Save functions for each step - accepts data directly to avoid race conditions
  saveStepData: (step: number, stepData: Partial<OnboardingData>) => Promise<SaveResult>
  completeOnboarding: () => Promise<SaveResult>
  // Status
  isComplete: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<OnboardingData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  // Fetch existing data when user is available
  // Use primitive userId instead of user object to prevent infinite loops
  const userId = user?.id
  useEffect(() => {
    async function loadExistingData() {
      if (!userId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const result = await fetchOnboardingData(userId)
        if (result.data) {
          setData(result.data)
          setIsComplete(result.isComplete)
        }
      } catch (error) {
        console.error('Failed to load onboarding data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadExistingData()
  }, [userId])

  const updateData = useCallback((partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }, [])

  const clearData = useCallback(() => {
    setData({})
  }, [])

  // Save data for a specific step - accepts data directly to avoid race conditions
  const saveStepData = useCallback(async (step: number, stepData: Partial<OnboardingData>): Promise<SaveResult> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    setIsSaving(true)
    try {
      let result: SaveResult

      switch (step) {
        case 1:
          result = await saveStep1(user.id, {
            phoneNumber: stepData.phoneNumber,
            personalEmail: stepData.personalEmail,
            ethnicity: stepData.ethnicity,
            dateOfBirth: stepData.dateOfBirth
          })
          break
        case 2:
          result = await saveStep2(user.id, {
            neighborNetId: stepData.neighborNetId
          })
          break
        case 3:
          result = await saveStep3(user.id, {
            ymRoles: stepData.ymRoles
          })
          break
        case 4:
          result = await saveStep4(user.id, {
            ymProjects: stepData.ymProjects
          })
          break
        case 5:
          result = await saveStep5(user.id, {
            educationLevel: stepData.educationLevel,
            education: stepData.education
          })
          break
        case 6:
          result = await saveStep6(user.id, {
            skills: stepData.skills
          })
          break
        default:
          result = { success: false, error: 'Invalid step' }
      }

      return result
    } catch (error) {
      console.error(`Error saving step ${step}:`, error)
      return { success: false, error: 'Failed to save' }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id])

  // Complete onboarding (mark as done)
  const completeOnboarding = useCallback(async (): Promise<SaveResult> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    setIsSaving(true)
    try {
      const result = await completeOnboardingApi(user.id)
      if (result.success) {
        setIsComplete(true)
      }
      return result
    } catch (error) {
      console.error('Error completing onboarding:', error)
      return { success: false, error: 'Failed to complete onboarding' }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id])

  return (
    <OnboardingContext.Provider value={{
      data,
      updateData,
      clearData,
      isLoading,
      isSaving,
      saveStepData,
      completeOnboarding,
      isComplete
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
