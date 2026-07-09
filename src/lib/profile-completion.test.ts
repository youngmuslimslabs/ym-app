import { describe, it, expect } from 'vitest'

import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'

import { computeProfileCompletion } from './profile-completion'

const empty: ProfileFormState = {}

const personal = {
  phoneNumber: '(555) 123-4567',
  personalEmail: 'me@example.com',
  ethnicity: 'Arab',
  dateOfBirth: new Date('2000-01-01'),
}

const validRole = { id: 'r1', isCurrent: true, roleTypeId: 'amir', startMonth: 1, startYear: 2022 }
const validProject = { id: 'p1', isCurrent: false, projectType: 'Ijtema', startMonth: 3, startYear: 2021 }

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

  it('skills done only at 3+', () => {
    expect(computeProfileCompletion({ skills: ['a', 'b'] }).sections.skills).toBe('todo')
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
