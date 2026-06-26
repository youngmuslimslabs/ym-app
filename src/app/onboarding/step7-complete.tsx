"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { useOnboarding } from "@/contexts/OnboardingContext"
import { toUserMessage } from "@/lib/errors/userMessage"
import {
  OnboardingLayout,
  OnboardingContent,
} from "./components"

export default function Step7() {
  const router = useRouter()
  const posthog = usePostHog()
  const { completeOnboarding, flushPendingSaves, clearData, isSaving } = useOnboarding()
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    setError(null)

    // Retry any failed background saves before completing
    const flushResult = await flushPendingSaves()
    if (!flushResult.success) {
      console.error('Onboarding flush failed:', flushResult.error)
      setError(toUserMessage(flushResult.error, { action: 'save a previous step' }))
      return
    }

    // Mark onboarding as complete
    const result = await completeOnboarding()

    if (!result.success) {
      console.error('Onboarding complete failed:', result.error)
      setError(toUserMessage(result.error, { action: 'finish setting up' }))
      return
    }

    // Fire conversion event before navigating away
    posthog?.capture('onboarding_completed', {})

    // Clear context data after saving
    clearData()

    // Navigate to home/dashboard
    router.push("/home")
  }

  const handleBack = () => {
    router.push("/onboarding?step=6")
  }

  return (
    <OnboardingLayout
      step={7}
      error={error}
      isValid={true}
      isSaving={isSaving}
      isLoading={false}
      onBack={handleBack}
      onNext={handleComplete}
      nextButtonText="Complete"
    >
      <OnboardingContent
        title="You're all set!"
        subtitle="Thanks for completing your profile. We're excited to have you here."
      >
        {/* Success Icon */}
        <div className="rounded-full bg-primary/10 p-6 mx-auto w-fit">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
      </OnboardingContent>
    </OnboardingLayout>
  )
}
