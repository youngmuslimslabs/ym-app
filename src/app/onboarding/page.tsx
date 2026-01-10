"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { OnboardingProvider } from "@/contexts/OnboardingContext"
import { PageLoader } from "@/components/ui/page-loader"
import { ONBOARDING_TOTAL_STEPS } from "./constants"
import Step1PersonalInfo from "./step1-personal-info"
import Step2Location from "./step2-location"
import Step3YmRoles from "./step3-ym-roles"
import Step4YmProjects from "./step4-ym-projects"
import Step5Education from "./step5-education"
import Step6Skills from "./step6-skills"
import Step7Complete from "./step7-complete"

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
        return <Step1PersonalInfo />
      case 2:
        return <Step2Location />
      case 3:
        return <Step3YmRoles />
      case 4:
        return <Step4YmProjects />
      case 5:
        return <Step5Education />
      case 6:
        return <Step6Skills />
      case 7:
        return <Step7Complete />
      default:
        return <Step1PersonalInfo />
    }
  }

  return <>{renderStep()}</>
}

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <Suspense fallback={<PageLoader />}>
        <OnboardingContent />
      </Suspense>
    </OnboardingProvider>
  )
}

