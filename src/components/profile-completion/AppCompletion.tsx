'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useProfileData } from '@/app/profile/hooks/useProfileData'
import { fetchProfileCompletedAt } from '@/lib/supabase/queries/profile'
import { computeProfileCompletion } from '@/lib/profile-completion'

import { CompletionProvider } from './CompletionProvider'
import { CompletionStrip } from './CompletionStrip'

/**
 * Mounts the profile-completion gating around the authenticated app:
 * - provides `requireComplete(action, proceed)` (via CompletionProvider) so any
 *   action button can gate itself behind a complete profile;
 * - renders the "Finish setting up your profile" strip at the top of app pages
 *   while the profile is incomplete.
 *
 * `isComplete` is the durable `profile_completed_at` flag (skip-safe), NOT the
 * client-side percent — the percent only drives the strip's display count.
 * Fails safe: until both the flag and profile data have loaded, it renders
 * children with no gating chrome, so a slow/failed fetch never blocks the app.
 */
export function AppCompletion({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profileData } = useProfileData()
  const [flag, setFlag] = useState<string | null | undefined>(undefined) // undefined = still loading

  useEffect(() => {
    let active = true
    fetchProfileCompletedAt().then((v) => {
      if (active) setFlag(v)
    })
    return () => {
      active = false
    }
  }, [])

  const completion = profileData ? computeProfileCompletion(profileData, new Set()) : null
  const ready = flag !== undefined && completion !== null

  if (!ready || !completion) {
    return <>{children}</>
  }

  const isComplete = flag !== null
  const goToComplete = () => router.push('/complete-profile')

  return (
    <CompletionProvider
      completion={{ ...completion, isComplete }}
      onGoToComplete={goToComplete}
    >
      {!isComplete && (
        <div className="px-4 pt-4 md:px-6">
          <CompletionStrip
            resolvedCount={completion.resolvedCount}
            total={completion.total}
            percent={completion.percent}
            onClick={goToComplete}
          />
        </div>
      )}
      {children}
    </CompletionProvider>
  )
}
