'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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

interface OnboardingContextType {
  data: OnboardingData
  updateData: (partial: Partial<OnboardingData>) => void
  clearData: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({})

  const updateData = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }))
  }

  const clearData = () => {
    setData({})
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
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
