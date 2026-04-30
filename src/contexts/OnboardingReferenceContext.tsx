'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fetchSubregions, fetchAllNeighborNets, type Subregion, type NeighborNet } from '@/lib/supabase/queries/location'
import { fetchRoleTypes, type RoleType } from '@/lib/supabase/queries/roles'
import { fetchCompletedUsers, type UserOption } from '@/lib/supabase/queries/users'
import { toUserMessage } from '@/lib/errors/userMessage'

interface OnboardingReferenceData {
  subregions: Subregion[]
  neighborNets: NeighborNet[]
  roleTypes: RoleType[]
  users: UserOption[]
  isLoading: boolean
  error: string | null
}

const OnboardingReferenceContext = createContext<OnboardingReferenceData | undefined>(undefined)

export function OnboardingReferenceProvider({ children }: { children: ReactNode }) {
  const [subregions, setSubregions] = useState<Subregion[]>([])
  const [neighborNets, setNeighborNets] = useState<NeighborNet[]>([])
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true)
      setError(null)

      const [subregionsResult, neighborNetsResult, roleTypesResult, usersResult] = await Promise.all([
        fetchSubregions(),
        fetchAllNeighborNets(),
        fetchRoleTypes(),
        fetchCompletedUsers(),
      ])

      // Check for critical errors (subregions and roleTypes are required)
      const firstError =
        subregionsResult.error ?? neighborNetsResult.error ?? roleTypesResult.error
      if (firstError) {
        console.error('Onboarding reference load error:', firstError)
        setError(toUserMessage(firstError, { action: 'load setup data' }))
        setIsLoading(false)
        return
      }

      setSubregions(subregionsResult.data || [])
      setNeighborNets(neighborNetsResult.data || [])
      setRoleTypes(roleTypesResult.data || [])
      // Users can be empty (no one completed onboarding yet) — that's OK
      setUsers(usersResult.data || [])
      setIsLoading(false)
    }

    loadAll()
  }, [])

  return (
    <OnboardingReferenceContext.Provider value={{
      subregions,
      neighborNets,
      roleTypes,
      users,
      isLoading,
      error,
    }}>
      {children}
    </OnboardingReferenceContext.Provider>
  )
}

export function useOnboardingReference() {
  const context = useContext(OnboardingReferenceContext)
  if (context === undefined) {
    throw new Error('useOnboardingReference must be used within an OnboardingReferenceProvider')
  }
  return context
}
