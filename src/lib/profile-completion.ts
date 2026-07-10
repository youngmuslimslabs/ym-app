import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'
import type {
  YMRoleEntry,
  YMProjectEntry,
  EducationEntry,
} from '@/contexts/OnboardingContext'

export type SectionKey =
  | 'personal'
  | 'location'
  | 'roles'
  | 'projects'
  | 'education'
  | 'skills'

export type SectionStatus = 'done' | 'skipped' | 'todo'

export interface ProfileCompletion {
  sections: Record<SectionKey, SectionStatus>
  resolvedCount: number
  total: number
  percent: number
  isComplete: boolean
}

export const SECTION_ORDER: SectionKey[] = [
  'personal',
  'location',
  'roles',
  'projects',
  'education',
  'skills',
]

/** Part-2 sections that can be legitimately empty ("I have none") and thus skipped. */
export const SKIPPABLE_SECTIONS: SectionKey[] = ['roles', 'projects']

/** A role/project is complete once its type is chosen. Dates are optional and
 * approximate (owner decision) — requiring exact start month/year pushed users to
 * guess or skip, degrading data. The type is the only hard requirement. */
export function roleValid(r: YMRoleEntry): boolean {
  return Boolean(r.roleTypeId || r.roleTypeCustom)
}
export function projectValid(p: YMProjectEntry): boolean {
  return Boolean(p.projectType || p.projectTypeCustom)
}

/** True when a repeatable entry was added but left with no meaningful data —
 * safe to silently drop on save rather than nag about it. */
export function isRoleEmpty(r: YMRoleEntry): boolean {
  return !r.roleTypeId && !r.roleTypeCustom && !r.amirUserId && !r.amirCustomName &&
    !r.startMonth && !r.startYear && !r.endMonth && !r.endYear && !r.description
}
export function isProjectEmpty(p: YMProjectEntry): boolean {
  return !p.projectType && !p.projectTypeCustom && !p.role && !p.amirUserId && !p.amirCustomName &&
    !p.startMonth && !p.startYear && !p.endMonth && !p.endYear && !p.description
}
function eduEntryValid(e: EducationEntry): boolean {
  return Boolean(
    (e.schoolName || e.schoolCustom) &&
      e.degreeType &&
      e.fieldOfStudy?.trim() &&
      e.graduationYear,
  )
}

/**
 * Compute per-section completion for the profile. A section is "done" when its
 * required fields are filled, "skipped" when the user explicitly said they have
 * none (roles/projects only), otherwise "todo". The profile is complete when
 * every section is resolved (done or skipped).
 */
export function computeProfileCompletion(
  data: ProfileFormState,
  skipped: Set<SectionKey> = new Set(),
): ProfileCompletion {
  const raw: Record<SectionKey, boolean> = {
    personal: Boolean(
      data.phoneNumber && data.personalEmail && data.ethnicity && data.dateOfBirth,
    ),
    location: Boolean(data.neighborNetId),
    roles: Boolean(data.ymRoles?.length && data.ymRoles.every(roleValid)),
    projects: Boolean(data.ymProjects?.length && data.ymProjects.every(projectValid)),
    education: Boolean(
      data.educationLevel &&
        (data.educationLevel !== 'college' ||
          (data.education?.length && data.education.some(eduEntryValid))),
    ),
    skills: Boolean(data.skills && data.skills.length >= 3),
  }

  const sections = {} as Record<SectionKey, SectionStatus>
  let resolvedCount = 0
  for (const key of SECTION_ORDER) {
    const status: SectionStatus = raw[key]
      ? 'done'
      : skipped.has(key)
        ? 'skipped'
        : 'todo'
    sections[key] = status
    if (status !== 'todo') resolvedCount++
  }

  const total = SECTION_ORDER.length
  return {
    sections,
    resolvedCount,
    total,
    percent: Math.round((resolvedCount / total) * 100),
    isComplete: resolvedCount === total,
  }
}
