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

/**
 * The sections the user actually works through in the Part-2 completion flow.
 * `personal` and `location` are captured during Part-1 onboarding (and are always
 * resolved by the time completion runs), so the hub + strip count ONLY these four.
 * Counting all six would show "3 of 6" next to four visible cards. `isComplete`
 * still keys off the full six-section model in `computeProfileCompletion`.
 */
export const PART2_SECTIONS: SectionKey[] = ['roles', 'projects', 'education', 'skills']

/** User-facing progress over just the four Part-2 sections (see `PART2_SECTIONS`). */
export function part2Progress(c: ProfileCompletion): {
  resolved: number
  total: number
  percent: number
} {
  const total = PART2_SECTIONS.length
  const resolved = PART2_SECTIONS.filter((k) => c.sections[k] !== 'todo').length
  return { resolved, total, percent: Math.round((resolved / total) * 100) }
}

/** A ROLE is complete once its type is chosen — a position ("Amir") is meaningful
 * on its own, and requiring exact dates pushed users to guess or skip. */
export function roleValid(r: YMRoleEntry): boolean {
  return Boolean(r.roleTypeId || r.roleTypeCustom)
}

/** A `system`-category role (e.g. Event Admin) is admin-granted and can never be
 * self-managed: the `role_assignments` RLS WITH CHECK rejects a user inserting or
 * updating one. Such a role loads into the form (so the user can see it) but must
 * be shown read-only and excluded from client writes. */
export function isSystemRole(r: YMRoleEntry): boolean {
  return r.roleTypeCategory === 'system'
}

/** The subset of form roles the client is allowed to write. System roles are held
 * back so a save never trips the RLS WITH CHECK (insert/update) — and, paired with
 * a system-aware delete scope, so a save never strips an admin-granted role.
 * User-added roles come from a picker that already excludes system roles, so their
 * `roleTypeCategory` is unset and they pass through unchanged. */
export function writableRoles(roles: YMRoleEntry[]): YMRoleEntry[] {
  return roles.filter((r) => !isSystemRole(r))
}
/** A PROJECT needs a type AND a start (month + year): a project category with no
 * "when" isn't useful data. */
export function projectValid(p: YMProjectEntry): boolean {
  return Boolean((p.projectType || p.projectTypeCustom) && p.startMonth && p.startYear)
}
/** Project has its type but is missing the required start date. */
export function projectNeedsStart(p: YMProjectEntry): boolean {
  return Boolean(p.projectType || p.projectTypeCustom) && !(p.startMonth && p.startYear)
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
    skills: Boolean(data.skills && data.skills.length >= 1),
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
