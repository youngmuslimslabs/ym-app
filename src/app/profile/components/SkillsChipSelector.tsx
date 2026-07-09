'use client'

import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { TagChipSelector } from '@/components/tag-chip-selector'
import { useProfileMode } from '@/contexts/ProfileModeContext'
import { cn } from '@/lib/utils'

// YM-relevant skills (matching step6-skills.tsx)
export const SKILLS = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'public-speaking', label: 'Public Speaking' },
  { id: 'project-management', label: 'Project Management' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'event-planning', label: 'Event Planning' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'graphic-design', label: 'Graphic Design' },
  { id: 'video-production', label: 'Video Production' },
  { id: 'writing', label: 'Writing' },
  { id: 'social-media', label: 'Social Media' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'finance', label: 'Finance' },
  { id: 'hr-people-ops', label: 'HR / People Ops' },
  { id: 'it-support', label: 'IT Support' },
  { id: 'community-outreach', label: 'Community Outreach' },
  { id: 'mentoring', label: 'Mentoring' },
  { id: 'arabic-language', label: 'Arabic Language' },
  { id: 'translation', label: 'Translation' },
] as const

interface SkillsChipSelectorProps {
  selectedSkills: string[]
  onToggle: (skillId: string) => void
  minSelection?: number
  className?: string
}

export function SkillsChipSelector({
  selectedSkills,
  onToggle,
  minSelection = 3,
  className,
}: SkillsChipSelectorProps) {
  const { isEditable } = useProfileMode()
  const selectionCount = selectedSkills.length
  const isValid = selectionCount >= minSelection

  const selectedSkillItems = SKILLS.filter((skill) => selectedSkills.includes(skill.id))

  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Skills</h2>
          {isEditable && (
            <p className="mt-1 text-sm text-muted-foreground">
              Select at least {minSelection} skills that best describe you
            </p>
          )}
        </div>
        {isEditable && (
          <Badge variant={isValid ? 'default' : 'secondary'} className="shrink-0">
            {selectionCount} selected
          </Badge>
        )}
      </div>

      {isEditable ? (
        <TagChipSelector
          options={SKILLS.map((skill) => ({ value: skill.id, label: skill.label }))}
          selected={selectedSkills}
          onToggle={onToggle}
        />
      ) : selectedSkillItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
          <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No skills added yet</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {selectedSkillItems.map((skill) => (
            <Badge key={skill.id} variant="default" className="px-3 py-1.5 text-sm">
              {skill.label}
            </Badge>
          ))}
        </div>
      )}
    </section>
  )
}
