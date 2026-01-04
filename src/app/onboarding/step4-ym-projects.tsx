"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  SearchableCombobox,
  ComboboxOption,
  ComboboxValue,
} from "@/components/searchable-combobox"
import { DateRangeInput } from "@/components/date-range-input"
import { useOnboarding, YMProjectEntry } from "@/contexts/OnboardingContext"
import { calculateProgress, PLACEHOLDER_AMIRS } from "./constants"

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
  const { data, updateData } = useOnboarding()

  // Initialize with one empty project entry or from context
  const [projects, setProjects] = useState<YMProjectEntry[]>(
    data.ymProjects?.length ? data.ymProjects : [createEmptyProject()]
  )

  const progressPercentage = calculateProgress(4)

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
    updateData({ ymProjects: projects })
    router.push("/onboarding?step=3")
  }

  const handleNext = () => {
    updateData({ ymProjects: projects })
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
      const option = PLACEHOLDER_AMIRS.find((a) => a.value === project.amirUserId)
      return { type: "existing", value: project.amirUserId, label: option?.label }
    }
    if (project.amirCustomName) {
      return { type: "custom", value: project.amirCustomName }
    }
    return undefined
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center py-12">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            What YM projects have you worked on?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about your project contributions
          </p>
        </div>

        {/* Project Entries */}
        <div className="w-full max-w-2xl space-y-4">
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
                    options={PLACEHOLDER_AMIRS}
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
      </div>

      {/* Navigation Buttons */}
      <div className="flex w-full items-center justify-center gap-4 pb-4">
        <Button variant="outline" onClick={handleBack} className="w-40">
          Back
        </Button>
        <Button onClick={handleNext} disabled={!isValid} className="w-40">
          Next
        </Button>
      </div>
    </div>
  )
}
