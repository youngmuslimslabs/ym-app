'use client'

import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
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
import { useProfileMode } from '@/contexts/ProfileModeContext'
import type { EducationEntry } from '@/contexts/OnboardingContext'

// The universities list (~230 KB) is only needed to edit, so it's loaded on
// demand rather than bundled into every read-only /people/[id] view. Converted
// once per session and shared across mounts.
let universitiesCache: ComboboxOption[] | null = null

function useUniversityOptions(enabled: boolean): ComboboxOption[] {
  const [options, setOptions] = useState<ComboboxOption[]>(() => universitiesCache ?? [])

  useEffect(() => {
    if (!enabled || universitiesCache) return
    let cancelled = false
    void import('@/data/us-universities.json').then((mod) => {
      universitiesCache = (mod.default as string[]).map((name) => ({
        value: name.toLowerCase().replace(/\s+/g, '-'),
        label: name,
      }))
      if (!cancelled) setOptions(universitiesCache)
    })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return options
}

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

  return parts.join(' • ')
}

function getEducationBadge(edu: EducationEntry): string | undefined {
  if (!edu.graduationYear || edu.graduationYear >= currentYear) {
    return 'Current'
  }
  return undefined
}

interface EducationSectionProps {
  education: EducationEntry[]
  onUpdateEducation: (index: number, updates: Partial<EducationEntry>) => void
  onAddEducation: () => void
  onRemoveEducation: (index: number) => void
}

export function EducationSection({
  education,
  onUpdateEducation,
  onAddEducation,
  onRemoveEducation,
}: EducationSectionProps) {
  const { isEditable } = useProfileMode()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const universities = useUniversityOptions(isEditable)

  const getSchoolValue = (edu: EducationEntry): ComboboxValue | undefined => {
    if (edu.schoolName) {
      const option = universities.find(u => u.label === edu.schoolName)
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

  const getDegreeLabel = (degreeType: string): string => {
    const degree = DEGREE_TYPES.find(d => d.value === degreeType)
    return degree?.label ?? degreeType
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
      <GraduationCap className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">No education added yet</p>
    </div>
  )

  return (
    <ExpandableCardList
      title="Education"
      description={isEditable ? "Your educational background" : "Educational background"}
      addLabel={isEditable ? "Add education" : undefined}
      onAdd={isEditable ? onAddEducation : undefined}
      emptyState={!isEditable ? emptyState : undefined}
    >
      {education.map((edu, index) => (
        <ExpandableCard
          key={edu.id}
          id={edu.id}
          title={getEducationTitle(edu)}
          subtitle={getEducationSubtitle(edu)}
          badge={getEducationBadge(edu)}
          isExpanded={expandedId === edu.id}
          onToggle={() => setExpandedId(expandedId === edu.id ? null : edu.id)}
          onDelete={isEditable ? () => onRemoveEducation(index) : undefined}
        >
          {isEditable ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>School Name</Label>
                <SearchableCombobox
                  options={universities}
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
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Degree:</span>
                <span className="ml-2 text-foreground">{edu.degreeType ? getDegreeLabel(edu.degreeType) : '—'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Field of Study:</span>
                <span className="ml-2 text-foreground">{edu.fieldOfStudy || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Graduation Year:</span>
                <span className="ml-2 text-foreground">{edu.graduationYear || '—'}</span>
              </div>
            </div>
          )}
        </ExpandableCard>
      ))}
    </ExpandableCardList>
  )
}
