"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { OnboardingProvider } from "@/contexts/OnboardingContext"
import { ONBOARDING_TOTAL_STEPS } from "./constants"
import PersonalInfo from "./personal-info"
import Step2 from "./step2"
import Step3 from "./step3"
import Step4 from "./step4"
import Step5 from "./step5"
import Step6 from "./step6"
import Step7 from "./step7"

function OnboardingContent() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    const step = searchParams.get("step")
    if (step) {
      const parsed = parseInt(step, 10)
      if (!isNaN(parsed) && parsed >= 1 && parsed <= ONBOARDING_TOTAL_STEPS) {
        setCurrentStep(parsed)
      }
    }
  }, [searchParams])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfo />
      case 2:
        return <Step2 />
      case 3:
        return <Step3 />
      case 4:
        return <Step4 />
      case 5:
        return <Step5 />
      case 6:
        return <Step6 />
      case 7:
        return <Step7 />
      default:
        return <PersonalInfo />
    }
  }

  return <>{renderStep()}</>
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }>
        <OnboardingContent />
      </Suspense>
    </OnboardingProvider>
  )
}

