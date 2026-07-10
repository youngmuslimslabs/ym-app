import { describe, it, expect } from 'vitest'

import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'

import {
  computeProfileCompletion,
  part2Progress,
  roleValid,
  projectValid,
  isRoleEmpty,
  isProjectEmpty,
  isSystemRole,
  writableRoles,
} from './profile-completion'

const empty: ProfileFormState = {}

const personal = {
  phoneNumber: '(555) 123-4567',
  personalEmail: 'me@example.com',
  ethnicity: 'Arab',
  dateOfBirth: new Date('2000-01-01'),
}

const validRole = { id: 'r1', isCurrent: true, roleTypeId: 'amir', startMonth: 1, startYear: 2022 }
const validProject = { id: 'p1', isCurrent: false, projectType: 'Ijtema', startMonth: 3, startYear: 2021 }

describe('entry validity (approximate dates OK — type is the only requirement)', () => {
  it('roleValid: a role is valid with just a type, no dates needed', () => {
    expect(roleValid({ id: 'r', isCurrent: true, roleTypeId: 'amir' })).toBe(true)
    expect(roleValid({ id: 'r', isCurrent: true, roleTypeCustom: 'Helper' })).toBe(true)
    expect(roleValid({ id: 'r', isCurrent: true, startMonth: 1, startYear: 2022 })).toBe(false)
  })

  it('projectValid: a project needs a type AND a start date (category alone is not enough)', () => {
    expect(projectValid({ id: 'p', isCurrent: false, projectType: 'Ijtema' })).toBe(false)
    expect(projectValid({ id: 'p', isCurrent: false, projectType: 'Ijtema', startMonth: 3, startYear: 2021 })).toBe(true)
    expect(projectValid({ id: 'p', isCurrent: false, startMonth: 3, startYear: 2021 })).toBe(false)
  })

  it('a dateless role still marks the roles section done', () => {
    const c = computeProfileCompletion({ ymRoles: [{ id: 'r', isCurrent: true, roleTypeId: 'amir' }] })
    expect(c.sections.roles).toBe('done')
  })

  it('isRoleEmpty / isProjectEmpty flag added-then-abandoned rows, but not partial ones', () => {
    expect(isRoleEmpty({ id: 'r', isCurrent: true })).toBe(true)
    expect(isRoleEmpty({ id: 'r', isCurrent: true, roleTypeId: 'amir' })).toBe(false)
    expect(isRoleEmpty({ id: 'r', isCurrent: true, startYear: 2022 })).toBe(false)
    expect(isProjectEmpty({ id: 'p', isCurrent: false })).toBe(true)
    expect(isProjectEmpty({ id: 'p', isCurrent: false, projectType: 'Ijtema' })).toBe(false)
  })
})

describe('system roles are excluded from client writes (RLS guard)', () => {
  const nsRole = { id: 'ns', isCurrent: true, roleTypeId: 'ns-member', roleTypeCategory: 'ns' }
  const eventAdmin = { id: 'ea', isCurrent: true, roleTypeId: 'event-admin', roleTypeCategory: 'system' }
  const userAdded = { id: 'new', isCurrent: true, roleTypeId: 'amir' } // no category (from picker)

  it('isSystemRole: true only for system-category roles', () => {
    expect(isSystemRole(eventAdmin)).toBe(true)
    expect(isSystemRole(nsRole)).toBe(false)
    expect(isSystemRole(userAdded)).toBe(false)
  })

  it('writableRoles: drops system roles, keeps everything else', () => {
    expect(writableRoles([nsRole, eventAdmin, userAdded])).toEqual([nsRole, userAdded])
  })

  it('regression: an Event Admin holder still writes their other roles, and the grant is untouched', () => {
    // Reproduces muneeb.syed@youngmuslims.com: the form loads an admin-granted
    // Event Admin (system) role alongside a normal role. Only the normal role
    // reaches the upsert, so the role_assignments RLS WITH CHECK is never violated.
    const written = writableRoles([nsRole, eventAdmin])
    expect(written.map((r) => r.id)).toEqual(['ns'])
    expect(written.some((r) => r.roleTypeCategory === 'system')).toBe(false)
  })
})

describe('computeProfileCompletion', () => {
  it('reports everything as todo for empty data', () => {
    const c = computeProfileCompletion(empty)
    expect(c.sections.personal).toBe('todo')
    expect(c.sections.location).toBe('todo')
    expect(c.sections.roles).toBe('todo')
    expect(c.isComplete).toBe(false)
    expect(c.percent).toBe(0)
    expect(c.total).toBe(6)
  })

  it('marks personal done when all four identity fields are present', () => {
    expect(computeProfileCompletion(personal).sections.personal).toBe('done')
  })

  it('marks location done when a NeighborNet is set', () => {
    expect(computeProfileCompletion({ neighborNetId: 'nn1' }).sections.location).toBe('done')
  })

  it('marks roles done only when at least one role has type + start date', () => {
    expect(computeProfileCompletion({ ymRoles: [validRole] }).sections.roles).toBe('done')
    expect(
      computeProfileCompletion({ ymRoles: [{ id: 'r', isCurrent: false }] }).sections.roles,
    ).toBe('todo')
  })

  it('treats a skipped roles/projects section as resolved (skipped)', () => {
    const c = computeProfileCompletion(empty, new Set(['roles', 'projects']))
    expect(c.sections.roles).toBe('skipped')
    expect(c.sections.projects).toBe('skipped')
  })

  it('education is done for a non-college level, todo for college without a valid entry', () => {
    expect(
      computeProfileCompletion({ educationLevel: 'high-school-graduate' }).sections.education,
    ).toBe('done')
    expect(computeProfileCompletion({ educationLevel: 'college' }).sections.education).toBe('todo')
    expect(
      computeProfileCompletion({
        educationLevel: 'college',
        education: [
          { id: 'e1', schoolName: 'UH', degreeType: 'Bachelor', fieldOfStudy: 'CS', graduationYear: 2024 },
        ],
      }).sections.education,
    ).toBe('done')
  })

  it('skills done with at least one selected (no hard quota)', () => {
    expect(computeProfileCompletion({ skills: [] }).sections.skills).toBe('todo')
    expect(computeProfileCompletion({ skills: ['a'] }).sections.skills).toBe('done')
    expect(computeProfileCompletion({ skills: ['a', 'b', 'c'] }).sections.skills).toBe('done')
  })

  it('isComplete + 100% when every section is resolved (filled or skipped)', () => {
    const c = computeProfileCompletion(
      {
        ...personal,
        neighborNetId: 'nn1',
        ymRoles: [validRole],
        educationLevel: 'high-school-graduate',
        skills: ['a', 'b', 'c'],
      },
      new Set(['projects']),
    )
    expect(c.isComplete).toBe(true)
    expect(c.percent).toBe(100)
    expect(c.resolvedCount).toBe(6)
  })
})

describe('part2Progress — hub/strip count only the four Part-2 sections', () => {
  it('ignores personal + location (basics come from Part-1 sign-up)', () => {
    // Basics done, but no Part-2 work yet -> 0 of 4, not 2 of 6.
    const c = computeProfileCompletion({ ...personal, neighborNetId: 'nn1' })
    expect(part2Progress(c)).toEqual({ resolved: 0, total: 4, percent: 0 })
  })

  it('counts a resolved Part-2 section (skills) as 1 of 4', () => {
    const c = computeProfileCompletion({ skills: ['a'] })
    expect(part2Progress(c)).toEqual({ resolved: 1, total: 4, percent: 25 })
  })

  it('reaches 4 of 4 / 100% when every Part-2 section is resolved (filled or skipped)', () => {
    const c = computeProfileCompletion(
      {
        ymRoles: [validRole],
        educationLevel: 'high-school-graduate',
        skills: ['a', 'b', 'c'],
      },
      new Set(['projects']),
    )
    expect(part2Progress(c)).toEqual({ resolved: 4, total: 4, percent: 100 })
  })
})
