'use client'

import { useState, useEffect, useRef } from 'react'
import { Briefcase } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { TagChipSelector } from '@/components/tag-chip-selector'
import {
  CONTRIBUTION_TAGS,
  parseTags,
  serializeTags,
  toggleTag,
} from './contribution-tags'
import {
  SearchableCombobox,
  type ComboboxOption,
  type ComboboxValue,
} from '@/components/searchable-combobox'
import { DateRangeInput } from '@/components/date-range-input'
import { ExpandableCard, ExpandableCardList } from './ExpandableCard'
import { useProfileMode } from '@/contexts/ProfileModeContext'
import type { YMProjectEntry } from '@/contexts/OnboardingContext'
import { fetchAllUsersForSelection } from '@/lib/supabase/queries/users'
import { projectValid, projectNeedsStart } from '@/lib/profile-completion'

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
  /** When true, reveal the required-field error on any entry missing its type. */
  showErrors?: boolean
}

export function YMProjectsSection({
  projects,
  onUpdateProject,
  onAddProject,
  onRemoveProject,
  showErrors = false,
}: YMProjectsSectionProps) {
  const { isEditable } = useProfileMode()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // When errors are revealed, open the first incomplete entry so the error shows.
  useEffect(() => {
    if (!showErrors) return
    const firstInvalid = projects.find((p) => !projectValid(p))
    if (firstInvalid) setExpandedId(firstInvalid.id)
  }, [showErrors, projects])

  // Expand a newly-added entry so it's ready to fill (not collapsed).
  const prevCount = useRef(projects.length)
  useEffect(() => {
    if (projects.length > prevCount.current) setExpandedId(projects[projects.length - 1].id)
    prevCount.current = projects.length
  }, [projects])
  const [amirOptions, setAmirOptions] = useState<ComboboxOption[]>([])

  // Only fetch dropdown options in edit mode — read-only uses pre-resolved names from the query
  useEffect(() => {
    if (!isEditable) return

    async function loadAmirs() {
      const { data } = await fetchAllUsersForSelection()
      if (data) {
        setAmirOptions(data)
      }
    }
    loadAmirs()
  }, [isEditable])

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
      const option = amirOptions.find(a => a.value === project.amirUserId)
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

  const getAmirDisplay = (project: YMProjectEntry): string => {
    if (project.amirUserName) {
      return project.amirUserName
    }
    if (project.amirUserId) {
      const option = amirOptions.find(a => a.value === project.amirUserId)
      return option?.label || project.amirUserId
    }
    if (project.amirCustomName) {
      return project.amirCustomName
    }
    return '—'
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
      <Briefcase className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">No projects added yet</p>
    </div>
  )

  return (
    <ExpandableCardList
      title="YM Projects"
      description={isEditable ? "Projects and initiatives you've contributed to" : "Projects and initiatives contributed to"}
      addLabel={isEditable ? "Add another project" : undefined}
      onAdd={isEditable ? onAddProject : undefined}
      emptyState={!isEditable ? emptyState : undefined}
    >
      {projects.map((project, index) => (
        <ExpandableCard
          key={project.id}
          id={project.id}
          title={getProjectTitle(project)}
          subtitle={getProjectSubtitle(project)}
          badge={project.isCurrent ? 'Current' : undefined}
          isExpanded={expandedId === project.id}
          onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
          onDelete={isEditable ? () => onRemoveProject(index) : undefined}
        >
          {isEditable ? (
            <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Project Type <span className="text-destructive">*</span>
              </Label>
              <SearchableCombobox
                options={PROJECT_TYPES}
                value={getProjectComboboxValue(project)}
                onChange={(value) => handleProjectTypeChange(index, value)}
                placeholder="Select or add a project type"
                searchPlaceholder="Search project types..."
                allowCustom
              />
              {showErrors && !(project.projectType || project.projectTypeCustom) && (
                <p className="text-sm text-destructive">Select a project type to continue.</p>
              )}
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
                options={amirOptions}
                value={getAmirComboboxValue(project)}
                onChange={(value) => handleAmirChange(index, value)}
                placeholder="Select or add a person"
                searchPlaceholder="Search people..."
                allowCustom
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Date Range <span className="text-destructive">*</span>
              </Label>
              <DateRangeInput
                startMonth={project.startMonth}
                startYear={project.startYear}
                endMonth={project.endMonth}
                endYear={project.endYear}
                isCurrent={project.isCurrent}
                onChange={(values) => onUpdateProject(index, values)}
                currentLabel="This project is ongoing"
              />
              {showErrors && projectNeedsStart(project) && (
                <p className="text-sm text-destructive">Add a start date to continue.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>What did you focus on? (optional)</Label>
              <TagChipSelector
                options={CONTRIBUTION_TAGS}
                selected={parseTags(project.description)}
                onToggle={(tag) =>
                  onUpdateProject(index, {
                    description: serializeTags(toggleTag(parseTags(project.description), tag)),
                  })
                }
                allowCustom
              />
            </div>
          </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Role:</span>
                <span className="ml-2 text-foreground">{project.role || '—'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Project Lead:</span>
                <span className="ml-2 text-foreground">{getAmirDisplay(project)}</span>
              </div>
              {project.description && (
                <div>
                  <span className="font-medium text-muted-foreground">Description:</span>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </div>
          )}
        </ExpandableCard>
      ))}
    </ExpandableCardList>
  )
}
