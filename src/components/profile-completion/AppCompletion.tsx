'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useProfileData } from '@/app/profile/hooks/useProfileData'
import { fetchProfileCompletedAt } from '@/lib/supabase/queries/profile'
import { computeProfileCompletion } from '@/lib/profile-completion'

import { CompletionProvider, useCompletion } from './CompletionProvider'
import { CompletionStrip } from './CompletionStrip'

// Actionable elements that get gated while the profile is incomplete. Plain
// navigation <a> links are intentionally excluded so browsing stays free;
// external action links (target="_blank", e.g. a finance form) are included.
const ACTIONABLE_SELECTOR =
  'button, [role="button"], input[type="submit"], input[type="button"], a[target="_blank"]'

/**
 * Wraps the page content and, while the profile is incomplete, intercepts clicks
 * on any actionable element (capture phase) and pops the completion gate instead.
 * Exhaustive by construction — every button in the content area is gated without
 * per-button wiring. The sidebar/header live outside this subtree (nav stays
 * free); the strip and gate dialog are excluded via [data-completion-allow].
 */
export function GatedContent({ children }: { children: React.ReactNode }) {
  const { requireComplete } = useCompletion()

  function handleClickCapture(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest(ACTIONABLE_SELECTOR)
    if (!el || el.closest('[data-completion-allow]')) return
    e.preventDefault()
    e.stopPropagation()
    // Incomplete → this opens the gate; proceed is a no-op (the action is blocked).
    requireComplete('continue', () => {})
  }

  // display:contents keeps this wrapper out of the layout box tree while still
  // sitting in the DOM event path, so capture works without affecting page CSS.
  return (
    <div className="contents" onClickCapture={handleClickCapture}>
      {children}
    </div>
  )
}

/**
 * Mounts the profile-completion gating around the authenticated app:
 * - the "Finish setting up your profile" strip at the top of app pages while incomplete;
 * - a uniform gate that blocks every content-area action button until complete.
 *
 * `isComplete` is the durable `profile_completed_at` flag (skip-safe), NOT the
 * client-side percent. Fails safe: until data loads, renders children with no
 * gating chrome, so a slow/failed fetch never blocks the app.
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
    <CompletionProvider completion={{ ...completion, isComplete }} onGoToComplete={goToComplete}>
      {!isComplete && (
        <div className="px-4 pt-4 md:px-6" data-completion-allow>
          <CompletionStrip
            resolvedCount={completion.resolvedCount}
            total={completion.total}
            percent={completion.percent}
            onClick={goToComplete}
          />
        </div>
      )}
      {isComplete ? children : <GatedContent>{children}</GatedContent>}
    </CompletionProvider>
  )
}
