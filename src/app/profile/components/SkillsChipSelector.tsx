'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

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
  maxSelection?: number
  className?: string
}

export function SkillsChipSelector({
  selectedSkills,
  onToggle,
  minSelection = 3,
  maxSelection = 5,
  className,
}: SkillsChipSelectorProps) {
  const selectionCount = selectedSkills.length
  const isAtMax = selectionCount >= maxSelection
  const isValid = selectionCount >= minSelection && selectionCount <= maxSelection

  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Skills</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select {minSelection} to {maxSelection} skills that best describe you
          </p>
        </div>
        <Badge
          variant={isValid ? 'default' : 'secondary'}
          className="shrink-0"
        >
          {selectionCount} of {maxSelection}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {SKILLS.map((skill) => {
          const isSelected = selectedSkills.includes(skill.id)
          const isDisabled = isAtMax && !isSelected

          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => !isDisabled && onToggle(skill.id)}
              disabled={isDisabled}
              className={cn(
                'group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full',
                'transition-all duration-200'
              )}
            >
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  'px-3 py-1.5 text-sm cursor-pointer transition-all duration-200',
                  'flex items-center gap-1.5',
                  isSelected && 'pr-2.5',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  !isDisabled && !isSelected && 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {isSelected && (
                  <Check className="h-3 w-3" />
                )}
                {skill.label}
              </Badge>
            </button>
          )
        })}
      </div>
    </section>
  )
}
