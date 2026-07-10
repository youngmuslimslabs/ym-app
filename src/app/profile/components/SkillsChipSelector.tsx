'use client'

import { Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { TagChipSelector } from '@/components/tag-chip-selector'
import { useProfileMode } from '@/contexts/ProfileModeContext'
import { cn } from '@/lib/utils'

// Concrete, resume-grade skills spanning what YM's cabinet departments
// (Marketing, HR, Operations, Special Projects, Fundraising, Finance, IT,
// Societal Impact), project types (conventions, retreats, workshops, service,
// sports…), and the religious/community work of the org actually draw on.
// Members can also add their own. Renders as one flat chip cloud — not sections.
export const SKILLS = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'project-management', label: 'Project Management' },
  { id: 'strategic-planning', label: 'Strategic Planning' },
  { id: 'public-speaking', label: 'Public Speaking' },
  { id: 'event-planning', label: 'Event Planning' },
  { id: 'program-development', label: 'Program Development' },
  { id: 'curriculum-design', label: 'Curriculum Design' },
  { id: 'volunteer-coordination', label: 'Volunteer Coordination' },
  { id: 'recruiting', label: 'Recruiting' },
  { id: 'training', label: 'Training & Development' },
  { id: 'mentoring', label: 'Mentoring' },
  { id: 'conflict-resolution', label: 'Conflict Resolution' },
  { id: 'sports-coaching', label: 'Sports Coaching' },
  { id: 'quran-recitation', label: 'Quran Recitation' },
  { id: 'tajweed', label: 'Tajweed' },
  { id: 'islamic-studies', label: 'Islamic Studies' },
  { id: 'halaqa-facilitation', label: 'Halaqa Facilitation' },
  { id: 'dawah', label: 'Dawah' },
  { id: 'community-outreach', label: 'Community Outreach' },
  { id: 'counseling', label: 'Counseling & Peer Support' },
  { id: 'teaching', label: 'Teaching' },
  { id: 'tutoring', label: 'Tutoring' },
  { id: 'arabic-language', label: 'Arabic Language' },
  { id: 'translation', label: 'Translation' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'social-media', label: 'Social Media' },
  { id: 'copywriting', label: 'Copywriting' },
  { id: 'writing', label: 'Writing' },
  { id: 'graphic-design', label: 'Graphic Design' },
  { id: 'video-production', label: 'Video Production' },
  { id: 'video-editing', label: 'Video Editing' },
  { id: 'photography', label: 'Photography' },
  { id: 'motion-graphics', label: 'Motion Graphics' },
  { id: 'branding', label: 'Branding' },
  { id: 'public-relations', label: 'Public Relations' },
  { id: 'email-marketing', label: 'Email Marketing' },
  { id: 'seo', label: 'SEO' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'app-development', label: 'App Development' },
  { id: 'ui-ux-design', label: 'UI/UX Design' },
  { id: 'it-support', label: 'IT Support' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'database-management', label: 'Database Management' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'av-sound', label: 'AV & Sound Production' },
  { id: 'fundraising', label: 'Fundraising' },
  { id: 'grant-writing', label: 'Grant Writing' },
  { id: 'donor-relations', label: 'Donor Relations' },
  { id: 'sponsorship-outreach', label: 'Sponsorship Outreach' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'bookkeeping', label: 'Bookkeeping' },
  { id: 'budgeting', label: 'Budgeting' },
] as const

const SKILL_LABEL = new Map<string, string>(SKILLS.map((s) => [s.id, s.label]))

interface SkillsChipSelectorProps {
  selectedSkills: string[]
  onToggle: (skillId: string) => void
  className?: string
}

export function SkillsChipSelector({
  selectedSkills,
  onToggle,
  className,
}: SkillsChipSelectorProps) {
  const { isEditable } = useProfileMode()
  const selectionCount = selectedSkills.length

  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Skills</h2>
          {isEditable && (
            <p className="mt-1 text-sm text-muted-foreground">
              Select as many as are applicable — or add your own.
            </p>
          )}
        </div>
        {isEditable && (
          <Badge variant={selectionCount > 0 ? 'default' : 'secondary'} className="shrink-0">
            {selectionCount} selected
          </Badge>
        )}
      </div>

      {isEditable ? (
        <TagChipSelector
          options={SKILLS.map((skill) => ({ value: skill.id, label: skill.label }))}
          selected={selectedSkills}
          onToggle={onToggle}
          allowCustom
        />
      ) : selectionCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed">
          <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No skills added yet</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {selectedSkills.map((id) => (
            <Badge key={id} variant="default" className="px-3 py-1.5 text-sm">
              {SKILL_LABEL.get(id) ?? id}
            </Badge>
          ))}
        </div>
      )}
    </section>
  )
}
