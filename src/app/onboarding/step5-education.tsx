"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SearchableCombobox,
  ComboboxOption,
  ComboboxValue,
} from "@/components/searchable-combobox"
import { useOnboarding, EducationEntry, EducationLevel } from "@/contexts/OnboardingContext"
import { calculateProgress } from "./constants"

// Import universities list
import universitiesData from "@/data/us-universities.json"

// Convert to combobox options (done once at module load)
const UNIVERSITIES: ComboboxOption[] = universitiesData.map((name: string) => ({
  value: name.toLowerCase().replace(/\s+/g, "-"),
  label: name,
}))

// Education level options
const EDUCATION_LEVELS = [
  { value: "high-school-current", label: "High school (currently attending)" },
  { value: "high-school-graduate", label: "High school graduate (no college)" },
  { value: "college", label: "College (current or completed)" },
]

// Degree types
const DEGREE_TYPES = [
  { value: "associates", label: "Associate's" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "professional", label: "Professional (JD, MD, etc.)" },
  { value: "other", label: "Other" },
]

// Generate graduation years (1980 to current + 5)
const currentYear = new Date().getFullYear()
const GRADUATION_YEARS = Array.from({ length: currentYear + 6 - 1980 }, (_, i) => ({
  value: (currentYear + 5 - i).toString(),
  label: (currentYear + 5 - i).toString(),
}))

function createEmptyEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
  }
}

export default function Step5() {
  const router = useRouter()
  const { data, updateData } = useOnboarding()

  // Education level state
  const [educationLevel, setEducationLevel] = useState<EducationLevel | undefined>(
    data.educationLevel
  )

  // Initialize with one empty education entry or from context
  const [education, setEducation] = useState<EducationEntry[]>(
    data.education?.length ? data.education : [createEmptyEducation()]
  )

  const progressPercentage = calculateProgress(5)

  // Check if user needs to fill out college education
  const requiresCollegeEducation = educationLevel === "college"

  // Validation: at least one education entry with required fields filled
  const isEducationValid = (edu: EducationEntry): boolean => {
    const hasSchool = Boolean(edu.schoolName || edu.schoolCustom)
    const hasDegree = Boolean(edu.degreeType)
    const hasField = Boolean(edu.fieldOfStudy?.trim())
    const hasYear = Boolean(edu.graduationYear)
    return hasSchool && hasDegree && hasField && hasYear
  }

  // Valid if: education level selected AND (no college required OR has valid education entry)
  const isValid = educationLevel !== undefined && (
    !requiresCollegeEducation || (education.length > 0 && education.some(isEducationValid))
  )

  const handleEducationChange = (index: number, updates: Partial<EducationEntry>) => {
    setEducation((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, ...updates } : edu))
    )
  }

  const handleAddEducation = () => {
    setEducation((prev) => [...prev, createEmptyEducation()])
  }

  const handleRemoveEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBack = () => {
    updateData({ educationLevel, education: requiresCollegeEducation ? education : [] })
    router.push("/onboarding?step=4")
  }

  const handleNext = () => {
    updateData({ educationLevel, education: requiresCollegeEducation ? education : [] })
    router.push("/onboarding?step=6")
  }

  const handleSchoolChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      handleEducationChange(index, { schoolName: undefined, schoolCustom: undefined })
    } else if (value.type === "existing") {
      handleEducationChange(index, { schoolName: value.label, schoolCustom: undefined })
    } else {
      handleEducationChange(index, { schoolName: undefined, schoolCustom: value.value })
    }
  }

  const getSchoolValue = (edu: EducationEntry): ComboboxValue | undefined => {
    if (edu.schoolName) {
      const option = UNIVERSITIES.find((u) => u.label === edu.schoolName)
      if (option) {
        return { type: "existing", value: option.value, label: edu.schoolName }
      }
      // School was from list but not found (edge case)
      return { type: "custom", value: edu.schoolName }
    }
    if (edu.schoolCustom) {
      return { type: "custom", value: edu.schoolCustom }
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
            Tell us about your education
          </h1>
          <p className="mt-3 text-muted-foreground">
            Select your current education level
          </p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          {/* Education Level Dropdown */}
          <div className="space-y-1.5">
            <Label>Education Level</Label>
            <Select
              value={educationLevel}
              onValueChange={(value) => setEducationLevel(value as EducationLevel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your education level" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Education Entries - only shown for college-level education */}
          {requiresCollegeEducation && (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <Card key={edu.id} className="relative">
                  {education.length > 1 && (
                    <button
                      onClick={() => handleRemoveEducation(index)}
                      className="absolute right-3 top-3 p-1 rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      aria-label="Remove education"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <CardContent className="pt-6 space-y-4">
                    {/* School Name */}
                    <div className="space-y-1.5">
                      <Label>School Name</Label>
                      <SearchableCombobox
                        options={UNIVERSITIES}
                        value={getSchoolValue(edu)}
                        onChange={(value) => handleSchoolChange(index, value)}
                        placeholder="Search for your school"
                        searchPlaceholder="Type to search universities..."
                        allowCustom
                        maxDisplayed={50}
                      />
                    </div>

                    {/* Degree Type */}
                    <div className="space-y-1.5">
                      <Label>Degree Type</Label>
                      <Select
                        value={edu.degreeType}
                        onValueChange={(value) =>
                          handleEducationChange(index, { degreeType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select degree type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEGREE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Field of Study */}
                    <div className="space-y-1.5">
                      <Label>Field of Study</Label>
                      <Input
                        value={edu.fieldOfStudy ?? ""}
                        onChange={(e) =>
                          handleEducationChange(index, { fieldOfStudy: e.target.value })
                        }
                        placeholder="e.g., Computer Science, Business Administration"
                      />
                    </div>

                    {/* Graduation Year */}
                    <div className="space-y-1.5">
                      <Label>Graduation Year (or expected)</Label>
                      <Select
                        value={edu.graduationYear?.toString()}
                        onValueChange={(value) =>
                          handleEducationChange(index, { graduationYear: parseInt(value, 10) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADUATION_YEARS.map((year) => (
                            <SelectItem key={year.value} value={year.value}>
                              {year.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Another Button */}
              <Button
                variant="outline"
                onClick={handleAddEducation}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another degree
              </Button>
            </div>
          )}
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
