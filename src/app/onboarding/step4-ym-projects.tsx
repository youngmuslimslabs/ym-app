"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  SearchableCombobox,
  ComboboxOption,
  ComboboxValue,
} from "@/components/searchable-combobox"
import { DateRangeInput } from "@/components/date-range-input"
import { useOnboarding, YMProjectEntry } from "@/contexts/OnboardingContext"
import { useOnboardingReference } from "@/contexts/OnboardingReferenceContext"
import {
  OnboardingLayout,
  OnboardingContent,
  OnboardingStepSkeleton,
  OnboardingErrorState,
} from "./components"

// Common YM project types
const PROJECT_TYPES: ComboboxOption[] = [
  { value: "convention", label: "Convention" },
  { value: "retreat", label: "Retreat" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "workshop", label: "Workshop" },
  { value: "community-event", label: "Community Event" },
  { value: "training", label: "Training Program" },
  { value: "outreach", label: "Outreach Initiative" },
  { value: "social", label: "Social Event" },
  { value: "service", label: "Service Project" },
  { value: "sports", label: "Sports Tournament" },
]


function createEmptyProject(): YMProjectEntry {
  return {
    id: crypto.randomUUID(),
    isCurrent: false,
  }
}

export default function Step4() {
  const router = useRouter()
  const posthog = usePostHog()
  const { data, updateData, saveStepInBackground, isLoading } = useOnboarding()
  const { users, isLoading: isLoadingData, error: loadError } = useOnboardingReference()

  // Initialize with one empty project entry or from context
  const [projects, setProjects] = useState<YMProjectEntry[]>(
    data.ymProjects?.length ? data.ymProjects : [createEmptyProject()]
  )

  // Sync state when data loads from Supabase (pre-fill)
  useEffect(() => {
    if (data.ymProjects?.length) {
      setProjects(data.ymProjects)
    }
  }, [data.ymProjects])

  // Convert users to combobox options
  const userOptions: ComboboxOption[] = users.map(user => ({
    value: user.id,
    label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
  }))

  // Validation: at least one project with required fields filled
  const isProjectValid = (project: YMProjectEntry): boolean => {
    const hasProjectType = Boolean(project.projectType || project.projectTypeCustom)
    const hasStartDate = Boolean(project.startMonth && project.startYear)
    return hasProjectType && hasStartDate
  }

  const isValid = projects.length > 0 && projects.every(isProjectValid)

  const handleProjectChange = (index: number, updates: Partial<YMProjectEntry>) => {
    setProjects((prev) =>
      prev.map((project, i) => (i === index ? { ...project, ...updates } : project))
    )
  }

  const handleAddProject = () => {
    setProjects((prev) => [...prev, createEmptyProject()])
  }

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBack = () => {
    const stepData = { ymProjects: projects }
    updateData(stepData)
    saveStepInBackground(4, stepData)
    router.push("/onboarding?step=3")
  }

  const handleNext = () => {
    const stepData = { ymProjects: projects }
    updateData(stepData)
    saveStepInBackground(4, stepData)
    posthog?.capture('onboarding_step_completed', {
      step: 4,
      step_name: 'ym_projects',
      project_count: projects.length,
    })
    router.push("/onboarding?step=5")
  }

  const handleProjectTypeChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      handleProjectChange(index, { projectType: undefined, projectTypeCustom: undefined })
    } else if (value.type === "existing") {
      handleProjectChange(index, { projectType: value.value, projectTypeCustom: undefined })
    } else {
      handleProjectChange(index, { projectType: undefined, projectTypeCustom: value.value })
    }
  }

  const handleAmirChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      handleProjectChange(index, { amirUserId: undefined, amirCustomName: undefined })
    } else if (value.type === "existing") {
      handleProjectChange(index, { amirUserId: value.value, amirCustomName: undefined })
    } else {
      handleProjectChange(index, { amirUserId: undefined, amirCustomName: value.value })
    }
  }

  const getProjectTypeValue = (project: YMProjectEntry): ComboboxValue | undefined => {
    if (project.projectType) {
      const option = PROJECT_TYPES.find((p) => p.value === project.projectType)
      return { type: "existing", value: project.projectType, label: option?.label }
    }
    if (project.projectTypeCustom) {
      return { type: "custom", value: project.projectTypeCustom }
    }
    return undefined
  }

  const getAmirValue = (project: YMProjectEntry): ComboboxValue | undefined => {
    if (project.amirUserId) {
      const option = userOptions.find((a) => a.value === project.amirUserId)
      return { type: "existing", value: project.amirUserId, label: option?.label }
    }
    if (project.amirCustomName) {
      return { type: "custom", value: project.amirCustomName }
    }
    return undefined
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return <OnboardingStepSkeleton />
  }

  // Show error state if data failed to load
  if (loadError) {
    return (
      <OnboardingErrorState
        message={loadError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <OnboardingLayout
      step={4}
      isValid={isValid}
      isLoading={isLoading}
      onBack={handleBack}
      onNext={handleNext}
    >
      <OnboardingContent
        title="What YM projects have you worked on?"
        subtitle="Tell us about your project contributions"
        centered={false}
        maxWidth="max-w-2xl"
      >
        {/* Project Entries */}
        <div className="space-y-4">
          {projects.map((project, index) => (
            <Card key={project.id} className="relative">
              {projects.length > 1 && (
                <button
                  onClick={() => handleRemoveProject(index)}
                  className="absolute right-3 top-3 p-1 rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Remove project"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <CardContent className="pt-6 space-y-4">
                {/* Project Type */}
                <div className="space-y-1.5">
                  <Label>Project Type</Label>
                  <SearchableCombobox
                    options={PROJECT_TYPES}
                    value={getProjectTypeValue(project)}
                    onChange={(value) => handleProjectTypeChange(index, value)}
                    placeholder="Select or add a project type"
                    searchPlaceholder="Search project types..."
                    allowCustom
                  />
                </div>

                {/* Your Role (free text) */}
                <div className="space-y-1.5">
                  <Label>Your Role</Label>
                  <Input
                    value={project.role ?? ""}
                    onChange={(e) =>
                      handleProjectChange(index, { role: e.target.value })
                    }
                    placeholder="e.g., Logistics Lead, Volunteer Coordinator"
                  />
                </div>

                {/* Amir/Manager */}
                <div className="space-y-1.5">
                  <Label>Amir / Manager</Label>
                  <SearchableCombobox
                    options={userOptions}
                    value={getAmirValue(project)}
                    onChange={(value) => handleAmirChange(index, value)}
                    placeholder="Select or add a person"
                    searchPlaceholder="Search people..."
                    allowCustom
                  />
                </div>

                {/* Date Range */}
                <div className="space-y-1.5">
                  <Label>Date Range</Label>
                  <DateRangeInput
                    startMonth={project.startMonth}
                    startYear={project.startYear}
                    endMonth={project.endMonth}
                    endYear={project.endYear}
                    isCurrent={project.isCurrent}
                    onChange={(values) => handleProjectChange(index, values)}
                    currentLabel="I'm currently on this project"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>What did you do? (optional)</Label>
                  <Textarea
                    value={project.description ?? ""}
                    onChange={(e) =>
                      handleProjectChange(index, { description: e.target.value })
                    }
                    placeholder="Describe your contributions and impact..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Another Button */}
          <Button
            variant="outline"
            onClick={handleAddProject}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add another project
          </Button>
        </div>
      </OnboardingContent>
    </OnboardingLayout>
  )
}
