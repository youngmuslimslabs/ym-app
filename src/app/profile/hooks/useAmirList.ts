'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface AmirOption {
  id: string
  name: string
  email: string
}

interface UseAmirListReturn {
  amirs: AmirOption[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAmirList(): UseAmirListReturn {
  const [amirs, setAmirs] = useState<AmirOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAmirs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Fetch all active users who could be amirs
      // In the future, this could be filtered by role or other criteria
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .not('first_name', 'is', null)
        .order('first_name', { ascending: true })

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      const amirOptions: AmirOption[] = (users ?? []).map((user) => ({
        id: user.id,
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email,
        email: user.email,
      }))

      setAmirs(amirOptions)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch amir list'
      setError(message)
      console.error('Amir list fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAmirs()
  }, [fetchAmirs])

  return {
    amirs,
    isLoading,
    error,
    refetch: fetchAmirs,
  }
}
