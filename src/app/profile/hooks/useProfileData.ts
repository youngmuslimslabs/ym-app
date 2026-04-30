'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchCurrentUserProfile } from '@/lib/supabase/queries/profile'
import { toUserMessage } from '@/lib/errors/userMessage'
import type { ProfileFormState } from './useProfileForm'

interface UseProfileDataReturn {
  profileData: ProfileFormState | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch the current authenticated user's profile
 */
export function useProfileData(): UseProfileDataReturn {
  const [profileData, setProfileData] = useState<ProfileFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await fetchCurrentUserProfile()

    if (fetchError) {
      console.error('Profile load error:', fetchError)
      setError(toUserMessage(fetchError, { action: 'load your profile' }))
      setProfileData(null)
    } else {
      setProfileData(data)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profileData,
    isLoading,
    error,
    refetch: fetchProfile,
  }
}
