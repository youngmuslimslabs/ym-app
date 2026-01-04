'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  SearchableCombobox,
  type ComboboxOption,
  type ComboboxValue,
} from '@/components/searchable-combobox'
import { DateRangeInput } from '@/components/date-range-input'
import { ExpandableCard, ExpandableCardList } from './ExpandableCard'
import type { YMProjectEntry } from '@/contexts/OnboardingContext'

// Project types (can be expanded)
const PROJECT_TYPES: ComboboxOption[] = [
  { value: 'tarbiya', label: 'Tarbiya Program' },
  { value: 'dawah', label: 'Dawah Project' },
  { value: 'community', label: 'Community Service' },
  { value: 'youth-camp', label: 'Youth Camp' },
  { value: 'retreat', label: 'Retreat' },
  { value: 'conference', label: 'Conference/Convention' },
  { value: 'fundraising', label: 'Fundraising Campaign' },
  { value: 'education', label: 'Educational Program' },
  { value: 'sports', label: 'Sports/Recreation' },
  { value: 'tech', label: 'Technology Project' },
  { value: 'media', label: 'Media/Content' },
  { value: 'other', label: 'Other' },
]

// TODO: Fetch from Supabase users table
const PLACEHOLDER_AMIRS: ComboboxOption[] = [
  { value: 'user-1', label: 'Ahmed Hassan' },
  { value: 'user-2', label: 'Fatima Al-Said' },
  { value: 'user-3', label: 'Omar Khan' },
  { value: 'user-4', label: 'Yasmin Ibrahim' },
  { value: 'user-5', label: 'Khalid Mohammed' },
]

function getProjectTitle(project: YMProjectEntry): string {
  if (project.projectType) {
    const found = PROJECT_TYPES.find(p => p.value === project.projectType)
    return found?.label ?? project.projectType
  }
  if (project.projectTypeCustom) {
    return project.projectTypeCustom
  }
  return 'New Project'
}

function getProjectSubtitle(project: YMProjectEntry): string {
  const parts: string[] = []

  if (project.role) {
    parts.push(project.role)
  }

  if (project.startMonth && project.startYear) {
    const startDate = new Date(project.startYear, project.startMonth - 1)
    const start = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    if (project.isCurrent) {
      parts.push(`${start} - Present`)
    } else if (project.endMonth && project.endYear) {
      const endDate = new Date(project.endYear, project.endMonth - 1)
      const end = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      parts.push(`${start} - ${end}`)
    } else {
      parts.push(start)
    }
  }

  return parts.join(' • ')
}

interface YMProjectsSectionProps {
  projects: YMProjectEntry[]
  onUpdateProject: (index: number, updates: Partial<YMProjectEntry>) => void
  onAddProject: () => void
  onRemoveProject: (index: number) => void
}

export function YMProjectsSection({
  projects,
  onUpdateProject,
  onAddProject,
  onRemoveProject,
}: YMProjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getProjectComboboxValue = (project: YMProjectEntry): ComboboxValue | undefined => {
    if (project.projectType) {
      const option = PROJECT_TYPES.find(p => p.value === project.projectType)
      return { type: 'existing', value: project.projectType, label: option?.label }
    }
    if (project.projectTypeCustom) {
      return { type: 'custom', value: project.projectTypeCustom }
    }
    return undefined
  }

  const getAmirComboboxValue = (project: YMProjectEntry): ComboboxValue | undefined => {
    if (project.amirUserId) {
      const option = PLACEHOLDER_AMIRS.find(a => a.value === project.amirUserId)
      return { type: 'existing', value: project.amirUserId, label: option?.label }
    }
    if (project.amirCustomName) {
      return { type: 'custom', value: project.amirCustomName }
    }
    return undefined
  }

  const handleProjectTypeChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateProject(index, { projectType: undefined, projectTypeCustom: undefined })
    } else if (value.type === 'existing') {
      onUpdateProject(index, { projectType: value.value, projectTypeCustom: undefined })
    } else {
      onUpdateProject(index, { projectType: undefined, projectTypeCustom: value.value })
    }
  }

  const handleAmirChange = (index: number, value: ComboboxValue | undefined) => {
    if (!value) {
      onUpdateProject(index, { amirUserId: undefined, amirCustomName: undefined })
    } else if (value.type === 'existing') {
      onUpdateProject(index, { amirUserId: value.value, amirCustomName: undefined })
    } else {
      onUpdateProject(index, { amirUserId: undefined, amirCustomName: value.value })
    }
  }

  return (
    <ExpandableCardList
      title="YM Projects"
      description="Projects and initiatives you've contributed to"
      addLabel="Add another project"
      onAdd={onAddProject}
    >
      {projects.map((project, index) => (
        <ExpandableCard
          key={project.id}
          id={project.id}
          title={getProjectTitle(project)}
          subtitle={getProjectSubtitle(project)}
          badge={project.isCurrent ? 'Active' : undefined}
          isExpanded={expandedId === project.id}
          onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
          onDelete={() => onRemoveProject(index)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Project Type</Label>
              <SearchableCombobox
                options={PROJECT_TYPES}
                value={getProjectComboboxValue(project)}
                onChange={(value) => handleProjectTypeChange(index, value)}
                placeholder="Select or add a project type"
                searchPlaceholder="Search project types..."
                allowCustom
              />
            </div>

            <div className="space-y-1.5">
              <Label>Your Role</Label>
              <Input
                value={project.role ?? ''}
                onChange={(e) => onUpdateProject(index, { role: e.target.value })}
                placeholder="e.g., Team Lead, Volunteer, Coordinator"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Project Lead / Amir</Label>
              <SearchableCombobox
                options={PLACEHOLDER_AMIRS}
                value={getAmirComboboxValue(project)}
                onChange={(value) => handleAmirChange(index, value)}
                placeholder="Select or add a person"
                searchPlaceholder="Search people..."
                allowCustom
              />
            </div>

            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <DateRangeInput
                startMonth={project.startMonth}
                startYear={project.startYear}
                endMonth={project.endMonth}
                endYear={project.endYear}
                isCurrent={project.isCurrent}
                onChange={(values) => onUpdateProject(index, values)}
                currentLabel="This project is ongoing"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                value={project.description ?? ''}
                onChange={(e) => onUpdateProject(index, { description: e.target.value })}
                placeholder="Describe the project and your contributions..."
                rows={3}
              />
            </div>
          </div>
        </ExpandableCard>
      ))}
    </ExpandableCardList>
  )
}
