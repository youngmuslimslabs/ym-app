"use client"

import { useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"

export default function Step7() {
  const router = useRouter()
  const { clearData } = useOnboarding()

  const progressPercentage = calculateProgress(7)

  const handleComplete = async () => {
    // TODO: Save all onboarding data to Supabase
    // TODO: Set onboarding_completed_at timestamp on user record

    // Clear context data after saving
    clearData()

    // Navigate to home/dashboard
    router.push("/home")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        {/* Success Icon */}
        <div className="rounded-full bg-primary/10 p-6">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            You&apos;re all set!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Thanks for completing your profile. We&apos;re excited to have you here.
          </p>
        </div>
      </div>

      {/* Navigation Button */}
      <div className="flex w-full items-center justify-center pb-4">
        <Button onClick={handleComplete} className="w-60">
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
