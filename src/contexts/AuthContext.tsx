'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

import { signOut as serverSignOut } from '@/app/auth/actions'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const posthog = usePostHog()

  useEffect(() => {
    const ALLOWED_DOMAIN = 'youngmuslims.com'

    // Domain validation is now handled server-side by middleware
    // We keep this client-side check for immediate UI feedback

    // Check active sessions and validate domain
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user

      // Validate domain for existing sessions
      if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('User with invalid domain detected, signing out')
        }
        supabase.auth.signOut()
        posthog?.reset()
        posthog?.capture('auth_domain_validation_failed', { trigger: 'session_restore', email_domain: user.email?.split('@')[1] ?? 'unknown' })
        setUser(null)
      } else {
        if (user) {
          posthog?.identify(user.id, { email: user.email ?? undefined })
        }
        setUser(user ?? null)
      }
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user

      // Validate domain for new sessions
      if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('User with invalid domain attempted login, signing out')
        }
        supabase.auth.signOut()
        posthog?.reset()
        posthog?.capture('auth_domain_validation_failed', { trigger: 'auth_state_change', email_domain: user.email?.split('@')[1] ?? 'unknown' })
        setUser(null)
      } else {
        if (user) {
          posthog?.identify(user.id, { email: user.email ?? undefined })
        } else {
          posthog?.reset()
        }
        setUser(user ?? null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [posthog])

  const signOut = async () => {
    posthog?.reset()
    await serverSignOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}