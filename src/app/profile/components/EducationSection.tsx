'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SearchableCombobox,
  type ComboboxOption,
  type ComboboxValue,
} from '@/components/searchable-combobox'
import { ExpandableCard, ExpandableCardList } from './ExpandableCard'
import type { EducationEntry, EducationLevel } from '@/contexts/OnboardingContext'

// Import universities list
import universitiesData from '@/data/us-universities.json'

// Convert to combobox options
const UNIVERSITIES: ComboboxOption[] = (universitiesData as string[]).map((name: string) => ({
  value: name.toLowerCase().replace(/\s+/g, '-'),
  label: name,
}))

// Education level options
const EDUCATION_LEVELS = [
  { value: 'high-school-current', label: 'High school (currently attending)' },
  { value: 'high-school-graduate', label: 'High school graduate (no college)' },
  { value: 'college', label: 'College (current or completed)' },
]

// Degree types
const DEGREE_TYPES = [
  { value: 'associates', label: "Associate's" },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'professional', label: 'Professional (JD, MD, etc.)' },
  { value: 'other', label: 'Other' },
]

// Generate graduation years
const currentYear = new Date().getFullYear()
const GRADUATION_YEARS = Array.from({ length: currentYear + 6 - 1980 }, (_, i) => ({
  value: (currentYear + 5 - i).toString(),
  label: (currentYear + 5 - i).toString(),
}))

function getEducationTitle(edu: EducationEntry): string {
  const school = edu.schoolName || edu.schoolCustom
  return school || 'New Education'
}

function getEducationSubtitle(edu: EducationEntry): string {
  const parts: string[] = []

  if (edu.degreeType) {
    const degree = DEGREE_TYPES.find(d => d.value === edu.degreeType)
    if (degree) parts.push(degree.label)
  }

  if (edu.fieldOfStudy) {
    parts.push(edu.fieldOfStudy)
  }

  if (edu.graduationYear) {
    parts.push(`Class of ${edu.graduationYear}`)
  }

  return parts.join(' • ')
}

interface EducationSectionProps {
  educationLevel?: EducationLevel
  education: EducationEntry[]
  onEducationLevelChange: (level: EducationLevel) => void
  onUpdateEducation: (index: number, updates: Partial<EducationEntry>) => void
  onAddEducation: () => void
  onRemoveEducation: (index: number) => void
}

export function EducationSection({
  educationLevel,
  education,
  onEducationLevelChange,
  onUpdateEducation,
  onAddEducation,
  onRemoveEducation,
}: EducationSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const requiresCollegeEducation = educationLevel === 'college'

  const getSchoolValue = (edu: EducationEntry): ComboboxValue | undefined => {
    if (edu.schoolName) {
      const option = UNIVERSITIES.find(u => u.label === edu.schoolName)
      if (option) {
        return { type: 'existing', value: option.value, label: edu.schoolName }
      }
      return { type: 'custom', value: edu.schoolName }
    }
    if (edu.schoolCustom) {
      return { type: 'custom', value: edu.schoolCustom }
    }
    return undefined
  }

  const handleSchoolChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateEducation(index, { schoolName: undefined, schoolCustom: undefined })
    } else if (value.type === 'existing') {
      onUpdateEducation(index, { schoolName: value.label, schoolCustom: undefined })
    } else {
      onUpdateEducation(index, { schoolName: undefined, schoolCustom: value.value })
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Education</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your educational background
        </p>
      </div>

      {/* Education Level */}
      <div className="flex flex-col gap-1.5">
        <Label>Education Level</Label>
        <Select
          value={educationLevel}
          onValueChange={(value) => onEducationLevelChange(value as EducationLevel)}
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

      {/* College Education Entries */}
      {requiresCollegeEducation && (
        <ExpandableCardList
          title=""
          addLabel="Add another degree"
          onAdd={onAddEducation}
        >
          {education.map((edu, index) => (
            <ExpandableCard
              key={edu.id}
              id={edu.id}
              title={getEducationTitle(edu)}
              subtitle={getEducationSubtitle(edu)}
              isExpanded={expandedId === edu.id}
              onToggle={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
              onDelete={education.length > 1 ? () => onRemoveEducation(index) : undefined}
            >
              <div className="space-y-4">
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

                <div className="space-y-1.5">
                  <Label>Degree Type</Label>
                  <Select
                    value={edu.degreeType}
                    onValueChange={(value) => onUpdateEducation(index, { degreeType: value })}
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

                <div className="space-y-1.5">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.fieldOfStudy ?? ''}
                    onChange={(e) => onUpdateEducation(index, { fieldOfStudy: e.target.value })}
                    placeholder="e.g., Computer Science, Business Administration"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Graduation Year (or expected)</Label>
                  <Select
                    value={edu.graduationYear?.toString()}
                    onValueChange={(value) =>
                      onUpdateEducation(index, { graduationYear: parseInt(value, 10) })
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
              </div>
            </ExpandableCard>
          ))}
        </ExpandableCardList>
      )}
    </section>
  )
}
