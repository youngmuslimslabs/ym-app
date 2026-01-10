"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"

// YM-relevant skills
const SKILLS = [
  { id: "leadership", label: "Leadership" },
  { id: "public-speaking", label: "Public Speaking" },
  { id: "project-management", label: "Project Management" },
  { id: "fundraising", label: "Fundraising" },
  { id: "event-planning", label: "Event Planning" },
  { id: "teaching", label: "Teaching" },
  { id: "marketing", label: "Marketing" },
  { id: "graphic-design", label: "Graphic Design" },
  { id: "video-production", label: "Video Production" },
  { id: "writing", label: "Writing" },
  { id: "social-media", label: "Social Media" },
  { id: "web-development", label: "Web Development" },
  { id: "data-analysis", label: "Data Analysis" },
  { id: "finance", label: "Finance" },
  { id: "hr-people-ops", label: "HR / People Ops" },
  { id: "it-support", label: "IT Support" },
  { id: "community-outreach", label: "Community Outreach" },
  { id: "mentoring", label: "Mentoring" },
  { id: "arabic-language", label: "Arabic Language" },
  { id: "translation", label: "Translation" },
]

export default function Step6() {
  const router = useRouter()
  const { data, updateData, saveStepData, isSaving, isLoading } = useOnboarding()

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    data.skills ?? []
  )
  const [saveError, setSaveError] = useState<string | null>(null)

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.skills?.length) setSelectedSkills(data.skills)
  }, [data.skills])

  const progressPercentage = calculateProgress(6)

  // Validation: must select between 3 and 5 skills
  const isValid = selectedSkills.length >= 3 && selectedSkills.length <= 5

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleBack = () => {
    updateData({ skills: selectedSkills })
    router.push("/onboarding?step=5")
  }

  const handleNext = async () => {
    setSaveError(null)
    const stepData = { skills: selectedSkills }

    updateData(stepData)
    const result = await saveStepData(6, stepData)
    if (!result.success) {
      setSaveError(result.error || "Failed to save. Please try again.")
      return
    }

    router.push("/onboarding?step=7")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-12">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What are your top skills?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Select 3 to 5 skills that best describe you
          </p>
        </div>

        {/* Skills Grid */}
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {SKILLS.map((skill) => {
            const isSelected = selectedSkills.includes(skill.id)
            return (
              <button
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
              >
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "px-4 py-2 text-sm cursor-pointer transition-all",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {skill.label}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Message */}
      {saveError && (
        <div className="mb-4 w-full max-w-md mx-auto rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex w-full items-center justify-center gap-4 pb-4">
        <Button variant="outline" onClick={handleBack} disabled={isSaving} className="w-40">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid || isSaving || isLoading} className="w-40">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Next"
          )}
        </Button>
      </div>
    </div>
  )
}
