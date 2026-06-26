'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import posthog from 'posthog-js'
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
  roleTypeName?: string
  roleTypeCustom?: string
  amirUserId?: string
  amirUserName?: string
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
  amirUserName?: string
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

interface PendingSaveError {
  step: number
  error: string
  data: Partial<OnboardingData>
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
  // Fire-and-forget save for optimistic navigation
  saveStepInBackground: (step: number, stepData: Partial<OnboardingData>) => void
  // Retry any failed background saves (call before completing onboarding)
  flushPendingSaves: () => Promise<SaveResult>
  // Background save error state
  pendingSaveError: PendingSaveError | null
  clearPendingSaveError: () => void
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
  const [dbUserId, setDbUserId] = useState<string | null>(null)
  const [pendingSaveError, setPendingSaveError] = useState<PendingSaveError | null>(null)
  const failedSaveRef = useRef<PendingSaveError | null>(null)

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
        if (result.userId) {
          setDbUserId(result.userId)
        }
      } catch (error) {
        console.error('Failed to load onboarding data:', error)
        try {
          posthog.capture('onboarding_error', {
            error_type: 'data_load_failed',
            error_message: error instanceof Error ? error.message : 'unknown',
          })
        } catch { /* observability must not affect error handling */ }
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

      const cachedId = dbUserId || undefined
      switch (step) {
        case 1:
          result = await saveStep1(user.id, {
            phoneNumber: stepData.phoneNumber,
            personalEmail: stepData.personalEmail,
            ethnicity: stepData.ethnicity,
            dateOfBirth: stepData.dateOfBirth
          }, cachedId)
          break
        case 2:
          result = await saveStep2(user.id, {
            neighborNetId: stepData.neighborNetId
          }, cachedId)
          break
        case 3:
          result = await saveStep3(user.id, {
            ymRoles: stepData.ymRoles
          }, cachedId)
          break
        case 4:
          result = await saveStep4(user.id, {
            ymProjects: stepData.ymProjects
          }, cachedId)
          break
        case 5:
          result = await saveStep5(user.id, {
            educationLevel: stepData.educationLevel,
            education: stepData.education
          }, cachedId)
          break
        case 6:
          result = await saveStep6(user.id, {
            skills: stepData.skills
          }, cachedId)
          break
        default:
          result = { success: false, error: 'Invalid step' }
      }

      return result
    } catch (error) {
      console.error(`Error saving step ${step}:`, error)
      try {
        posthog.capture('onboarding_error', {
          error_type: 'step_save_failed',
          step,
          error_message: error instanceof Error ? error.message : 'unknown',
        })
      } catch { /* observability must not affect error handling */ }
      return { success: false, error: 'Failed to save' }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, dbUserId])

  // Fire-and-forget save for optimistic navigation
  const saveStepInBackground = useCallback((step: number, stepData: Partial<OnboardingData>) => {
    saveStepData(step, stepData).then(result => {
      if (!result.success) {
        const error: PendingSaveError = { step, error: result.error || 'Failed to save', data: stepData }
        failedSaveRef.current = error
        setPendingSaveError(error)
      } else {
        // Clear error if this step previously failed and now succeeded
        if (failedSaveRef.current?.step === step) {
          failedSaveRef.current = null
          setPendingSaveError(null)
        }
      }
    })
  }, [saveStepData])

  // Retry any failed background save before completing onboarding
  const flushPendingSaves = useCallback(async (): Promise<SaveResult> => {
    const failed = failedSaveRef.current
    if (!failed) return { success: true }

    const result = await saveStepData(failed.step, failed.data)
    if (result.success) {
      failedSaveRef.current = null
      setPendingSaveError(null)
    }
    return result
  }, [saveStepData])

  const clearPendingSaveError = useCallback(() => {
    failedSaveRef.current = null
    setPendingSaveError(null)
  }, [])

  // Complete onboarding (mark as done)
  const completeOnboarding = useCallback(async (): Promise<SaveResult> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    setIsSaving(true)
    try {
      const result = await completeOnboardingApi(user.id, dbUserId || undefined)
      if (result.success) {
        setIsComplete(true)
      }
      return result
    } catch (error) {
      console.error('Error completing onboarding:', error)
      try {
        posthog.capture('onboarding_error', {
          error_type: 'complete_failed',
          error_message: error instanceof Error ? error.message : 'unknown',
        })
      } catch { /* observability must not affect error handling */ }
      return { success: false, error: 'Failed to complete onboarding' }
    } finally {
      setIsSaving(false)
    }
  }, [user?.id, dbUserId])

  return (
    <OnboardingContext.Provider value={{
      data,
      updateData,
      clearData,
      isLoading,
      isSaving,
      saveStepData,
      saveStepInBackground,
      flushPendingSaves,
      pendingSaveError,
      clearPendingSaveError,
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
