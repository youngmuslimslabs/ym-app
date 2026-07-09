'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, MinusCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProfileModeProvider } from '@/contexts/ProfileModeContext'
import type { EducationLevel } from '@/contexts/OnboardingContext'
import { useProfileForm, type ProfileFormState } from '@/app/profile/hooks/useProfileForm'
import { YMRolesSection } from '@/app/profile/components/YMRolesSection'
import { YMProjectsSection } from '@/app/profile/components/YMProjectsSection'
import { EducationSection } from '@/app/profile/components/EducationSection'
import { SkillsChipSelector } from '@/app/profile/components/SkillsChipSelector'
import {
  computeProfileCompletion,
  type SectionKey,
  type SectionStatus,
} from '@/lib/profile-completion'

const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'high-school-current', label: 'In high school' },
  { value: 'high-school-graduate', label: 'High-school graduate' },
  { value: 'college', label: 'In or completed college' },
]

const PART2: { key: SectionKey; label: string; hint: string; skippable?: boolean }[] = [
  { key: 'roles', label: 'Role history', hint: 'Roles you’ve held', skippable: true },
  { key: 'projects', label: 'Projects', hint: 'Projects you’ve worked on', skippable: true },
  { key: 'education', label: 'Education', hint: 'Level, and school if applicable' },
  { key: 'skills', label: 'Skills', hint: 'Pick at least 3' },
]

function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-primary" />
  if (status === 'skipped') return <MinusCircle className="h-5 w-5 text-muted-foreground" />
  return <Circle className="h-5 w-5 text-muted-foreground" />
}

export function ProfileCompletion({
  initialData,
  onComplete,
}: {
  initialData: ProfileFormState
  onComplete?: () => void
}) {
  const form = useProfileForm(initialData)
  const [skipped, setSkipped] = useState<Set<SectionKey>>(new Set())
  const [view, setView] = useState<'hub' | SectionKey>('hub')

  const completion = computeProfileCompletion(form.formData, skipped)

  async function persist(): Promise<boolean> {
    const result = await form.saveForm()
    if (!result.success) {
      toast.error(result.error ?? 'Could not save your profile. Try again.')
      return false
    }
    return true
  }

  function skip(key: SectionKey) {
    if (key === 'roles') form.updateField('ymRoles', [])
    if (key === 'projects') form.updateField('ymProjects', [])
    setSkipped((prev) => new Set(prev).add(key))
    setView('hub')
  }

  async function finish() {
    const ok = await persist()
    if (ok) {
      toast.success('Profile complete')
      onComplete?.()
    }
  }

  // ---- Hub view ----
  if (view === 'hub') {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A few more details so people can find you. Your progress saves as you go.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-primary/15">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {completion.resolvedCount} of {completion.total}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {PART2.map((section) => {
            const status = completion.sections[section.key]
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setView(section.key)}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <StatusIcon status={status} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{section.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {status === 'done'
                      ? 'Added'
                      : status === 'skipped'
                        ? 'Skipped'
                        : section.hint}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )
          })}
        </div>

        <div className="mt-auto pt-8">
          <Button
            size="lg"
            className="w-full"
            disabled={form.isSaving}
            onClick={finish}
          >
            {completion.isComplete ? 'Finish' : 'Save & continue later'}
          </Button>
        </div>
      </div>
    )
  }

  // ---- Section view ----
  const section = PART2.find((s) => s.key === view)!
  let body: React.ReactNode = null
  if (view === 'roles') {
    body = (
      <YMRolesSection
        roles={form.formData.ymRoles ?? []}
        onUpdateRole={form.updateRole}
        onAddRole={form.addRole}
        onRemoveRole={form.removeRole}
      />
    )
  } else if (view === 'projects') {
    body = (
      <YMProjectsSection
        projects={form.formData.ymProjects ?? []}
        onUpdateProject={form.updateProject}
        onAddProject={form.addProject}
        onRemoveProject={form.removeProject}
      />
    )
  } else if (view === 'education') {
    body = (
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Education level</label>
          <Select
            value={form.formData.educationLevel ?? ''}
            onValueChange={(v) => form.updateField('educationLevel', v as EducationLevel)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your level" />
            </SelectTrigger>
            <SelectContent>
              {EDUCATION_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.formData.educationLevel === 'college' && (
          <EducationSection
            education={form.formData.education ?? []}
            onUpdateEducation={form.updateEducation}
            onAddEducation={form.addEducation}
            onRemoveEducation={form.removeEducation}
          />
        )}
      </div>
    )
  } else if (view === 'skills') {
    body = (
      <SkillsChipSelector
        selectedSkills={form.formData.skills ?? []}
        onToggle={form.toggleSkill}
      />
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-6">
      <button
        type="button"
        onClick={() => setView('hub')}
        className="-ml-1 flex w-fit items-center gap-1 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex-1 py-6">
        <ProfileModeProvider isEditable>{body}</ProfileModeProvider>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <Button size="lg" className="w-full" onClick={() => setView('hub')}>
          Done
        </Button>
        {section.skippable && (
          <Button variant="ghost" className="w-full" onClick={() => skip(view as SectionKey)}>
            I haven’t done any YM {view}
          </Button>
        )}
      </div>
    </div>
  )
}
