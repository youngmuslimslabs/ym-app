'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ProfileGate } from '@/components/profile-completion/ProfileGate'

// A single source of truth for "how complete is this profile" that drives BOTH
// the persistent ProfileCompletionCard and the contextual ProfileGate, so the
// two surfaces can never disagree (the LinkedIn "Profile Strength" model).
//
// PROTOTYPE NOTE: in the real app `sections` would be computed server-side from
// the user's filled profile rows (extend getIncompleteStep/fetchOnboardingData).
// Here the provider holds them in state so a dev control bar can drive the demo.

export interface CompletionSections {
  personal: boolean
  location: boolean
  roles: boolean
  projects: boolean
  education: boolean
  skills: boolean
}

export interface MissingItem {
  key: keyof CompletionSections
  label: string
}

export interface ProfileCompletion {
  percent: number
  sections: CompletionSections
  missing: MissingItem[]
}

export interface GateRequest {
  /** Verb phrase naming the blocked action, e.g. "check in", "RSVP to this session". */
  action: string
  /** The specific fields needed for this action, e.g. ["Your role", "Your region"]. */
  requiredLabels: string[]
}

// Ordered so the checklist and progress read the same everywhere.
export const SECTION_ORDER: (keyof CompletionSections)[] = [
  'personal',
  'location',
  'roles',
  'projects',
  'education',
  'skills',
]

export const SECTION_LABELS: Record<keyof CompletionSections, string> = {
  personal: 'Personal info',
  location: 'Location',
  roles: 'Role history',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
}

// Endowed-progress presets: personal + location come "free" from Part 1
// onboarding, so a new profile never opens at 0%.
export const PRESET_NEW: CompletionSections = {
  personal: true,
  location: true,
  roles: false,
  projects: false,
  education: false,
  skills: false,
}

export const PRESET_PARTLY: CompletionSections = {
  personal: true,
  location: true,
  roles: true,
  projects: false,
  education: false,
  skills: true,
}

export const PRESET_COMPLETE: CompletionSections = {
  personal: true,
  location: true,
  roles: true,
  projects: true,
  education: true,
  skills: true,
}

function deriveCompletion(sections: CompletionSections): ProfileCompletion {
  const done = SECTION_ORDER.filter((key) => sections[key]).length
  const percent = Math.round((done / SECTION_ORDER.length) * 100)
  const missing = SECTION_ORDER.filter((key) => !sections[key]).map((key) => ({
    key,
    label: SECTION_LABELS[key],
  }))
  return { percent, sections, missing }
}

interface ProfileCompletionContextValue {
  completion: ProfileCompletion
  isComplete: boolean
  /** Open the contextual gate for a specific attempted action. */
  openGate: (request: GateRequest) => void
  /** The currently-open gate request, or null when the gate is closed. */
  gateRequest: GateRequest | null
  closeGate: () => void
  /** Simulate the user finishing the missing fields (prototype-only). */
  markComplete: () => void
  /** Drive the demo from the dev control bar (prototype-only). */
  applyPreset: (sections: CompletionSections) => void
}

const ProfileCompletionContext = createContext<
  ProfileCompletionContextValue | undefined
>(undefined)

export function ProfileCompletionProvider({
  children,
  initial = PRESET_NEW,
}: {
  children: ReactNode
  initial?: CompletionSections
}) {
  const [sections, setSections] = useState<CompletionSections>(initial)
  const [gateRequest, setGateRequest] = useState<GateRequest | null>(null)

  const completion = useMemo(() => deriveCompletion(sections), [sections])
  const isComplete = completion.percent >= 100

  const openGate = useCallback((request: GateRequest) => {
    setGateRequest(request)
  }, [])

  const closeGate = useCallback(() => setGateRequest(null), [])

  const markComplete = useCallback(() => {
    setSections(PRESET_COMPLETE)
    setGateRequest(null)
  }, [])

  const applyPreset = useCallback((next: CompletionSections) => {
    setSections(next)
  }, [])

  const value = useMemo<ProfileCompletionContextValue>(
    () => ({
      completion,
      isComplete,
      openGate,
      gateRequest,
      closeGate,
      markComplete,
      applyPreset,
    }),
    [completion, isComplete, openGate, gateRequest, closeGate, markComplete, applyPreset]
  )

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
      {/* Rendered once here so any descendant can trigger the gate via openGate. */}
      <ProfileGate />
    </ProfileCompletionContext.Provider>
  )
}

export function useProfileCompletion() {
  const context = useContext(ProfileCompletionContext)
  if (!context) {
    throw new Error(
      'useProfileCompletion must be used within ProfileCompletionProvider'
    )
  }
  return context
}
