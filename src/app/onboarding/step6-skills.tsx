"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePostHog } from "posthog-js/react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useOnboarding } from "@/contexts/OnboardingContext"
import { OnboardingLayout, OnboardingContent } from "./components"

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
  const posthog = usePostHog()
  const { data, updateData, saveStepInBackground, isLoading } = useOnboarding()

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    data.skills ?? []
  )

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.skills?.length) setSelectedSkills(data.skills)
  }, [data.skills])

  // Validation: must select at least 3 skills
  const isValid = selectedSkills.length >= 3

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleBack = () => {
    const stepData = { skills: selectedSkills }
    updateData(stepData)
    saveStepInBackground(6, stepData)
    router.push("/onboarding?step=5")
  }

  const handleNext = () => {
    const stepData = { skills: selectedSkills }
    updateData(stepData)
    saveStepInBackground(6, stepData)
    posthog?.capture('onboarding_step_completed', {
      step: 6,
      step_name: 'skills',
      skill_count: selectedSkills.length,
    })
    router.push("/onboarding?step=7")
  }

  return (
    <OnboardingLayout
      step={6}
      isValid={isValid}
      isLoading={isLoading}
      onBack={handleBack}
      onNext={handleNext}
    >
      <OnboardingContent
        title="What are your top skills?"
        subtitle="Select at least 3 skills that best describe you"
        maxWidth="max-w-2xl"
      >
        {/* Skills Grid */}
        <div className="flex flex-wrap justify-center gap-3">
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
      </OnboardingContent>
    </OnboardingLayout>
  )
}
