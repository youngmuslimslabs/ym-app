'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchUserProfileById } from '@/lib/supabase/queries/profile'
import { toUserMessage } from '@/lib/errors/userMessage'
import type { ProfileFormState } from './useProfileForm'

interface UsePersonProfileReturn {
  personData: ProfileFormState | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch any user's profile by their user ID
 * @param userId - The user ID to fetch profile for
 */
export function usePersonProfile(userId: string): UsePersonProfileReturn {
  const [personData, setPersonData] = useState<ProfileFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setError("We couldn't find that profile.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await fetchUserProfileById(userId)

    if (fetchError) {
      console.error('Person profile load error:', fetchError)
      setError(toUserMessage(fetchError, { action: 'load this profile' }))
      setPersonData(null)
    } else {
      setPersonData(data)
    }

    setIsLoading(false)
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    personData,
    isLoading,
    error,
    refetch: fetchProfile,
  }
}
