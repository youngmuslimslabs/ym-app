'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

interface EnterAppButtonProps {
  // Resolves true once the app is leaving onboarding (the save worked and a
  // navigation is under way); anything else means the save failed and the
  // user can try again.
  onEnter: () => Promise<boolean | void> | boolean | void
}

/**
 * The final "Enter the app" CTA. It stays pending from the tap until the page
 * unloads. Re-enabling it after a successful save, while /home was still
 * loading, looked like nothing had happened, so members tapped again and each
 * tap re-ran every write and restarted the navigation (#61). Only a failed
 * save hands the button back.
 */
export function EnterAppButton({ onEnter }: EnterAppButtonProps) {
  const [submitting, setSubmitting] = useState(false)

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={submitting}
      onClick={async () => {
        setSubmitting(true)
        let leaving = false
        try {
          leaving = (await onEnter()) === true
        } finally {
          if (!leaving) setSubmitting(false)
        }
      }}
    >
      {submitting ? 'Entering…' : 'Enter the app'}
    </Button>
  )
}
