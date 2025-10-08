'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ALLOWED_DOMAIN = 'youngmuslims.com'

    // TODO: Add server-side domain validation via Supabase Auth Hook or RLS policy
    // Client-side validation can be bypassed - this is only for UX feedback

    // Check active sessions and validate domain
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user

      // Validate domain for existing sessions
      if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.warn('User with invalid domain detected, signing out')
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(user ?? null)
      }
      setLoading(false)
    })

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user

      // Validate domain for new sessions
      if (user && !user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.warn('User with invalid domain attempted login, signing out')
        supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(user ?? null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// TODO: Add error boundary to catch useAuth errors and prevent full app crashes
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}