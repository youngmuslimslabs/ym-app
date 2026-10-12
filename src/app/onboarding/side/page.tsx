'use client'

// One-question step for members who finished onboarding before the
// Brothers/Sisters question existed. Middleware sends onboarded users with
// users.side = NULL here (and only them); the full onboarding asks it inline.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { SideStep } from '@/components/onboarding-flow/steps'
import { saveCurrentUserSide } from '@/lib/supabase/onboarding'
import { rememberSide, type Side } from '@/lib/side'

export default function SideOnboardingPage() {
  const router = useRouter()
  const [side, setSide] = useState<Side | undefined>()
  const [saving, setSaving] = useState(false)

  async function handleConfirm() {
    if (!side) return
    setSaving(true)
    const result = await saveCurrentUserSide(side)
    if (!result.success) {
      setSaving(false)
      toast.error(result.error ?? 'Could not save your side. Please try again.')
      return
    }
    rememberSide(side)
    router.replace('/home/')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-8">
      <SideStep
        value={side}
        // SideStep previews the chosen side's theme; it's saved on Confirm.
        onSelect={setSide}
        onNext={handleConfirm}
        ctaLabel={saving ? 'Saving…' : 'Confirm'}
        disabled={saving}
      />
    </div>
  )
}
