import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'

import { ProfileCompletion } from './ProfileCompletion'

const completeData: ProfileFormState = {
  phoneNumber: '(555) 123-4567',
  personalEmail: 'me@example.com',
  ethnicity: 'Arab',
  dateOfBirth: new Date('2000-01-01'),
  neighborNetId: 'nn1',
  ymRoles: [{ id: 'r1', isCurrent: true, roleTypeId: 'amir', startMonth: 1, startYear: 2022 }],
  ymProjects: [
    { id: 'p1', isCurrent: false, projectType: 'Ijtema', startMonth: 3, startYear: 2021 },
  ],
  educationLevel: 'high-school-graduate',
  skills: ['a', 'b', 'c'],
}

describe('ProfileCompletion hub', () => {
  it('lists the four Part-2 sections', () => {
    render(<ProfileCompletion initialData={{}} />)
    expect(screen.getByText('Role history')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Skills')).toBeInTheDocument()
  })

  it('counts only the four Part-2 sections (basics come from sign-up)', () => {
    // only skills filled -> 1 of 4 (roles/projects/education still to do)
    render(<ProfileCompletion initialData={{ skills: ['a', 'b', 'c'] }} />)
    expect(screen.getByText('1 of 4')).toBeInTheDocument()
  })

  it('offers "Save & continue later" while incomplete', () => {
    render(<ProfileCompletion initialData={{}} />)
    expect(
      screen.getByRole('button', { name: /save & continue later/i }),
    ).toBeInTheDocument()
  })

  it('offers "Finish" and shows 4 of 4 when everything is resolved', () => {
    render(<ProfileCompletion initialData={completeData} />)
    expect(screen.getByText('4 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^finish$/i })).toBeInTheDocument()
  })

  it('offers "Finish" once the four Part-2 sections are resolved, even with personal/location unset', () => {
    // Regression for the 4-vs-6 lockout: completion is driven by the four
    // on-screen Part-2 sections, not the full six-section model. Without personal
    // (phone/email/ethnicity/dob) or location (neighborNetId), the button used to
    // stay "Save & continue later" forever and never set profile_completed_at.
    const part2Only: ProfileFormState = {
      ymRoles: [{ id: 'r1', isCurrent: true, roleTypeId: 'amir' }],
      ymProjects: [
        { id: 'p1', isCurrent: false, projectType: 'convention', startMonth: 3, startYear: 2021 },
      ],
      educationLevel: 'high-school-graduate',
      skills: ['a'],
    }
    render(<ProfileCompletion initialData={part2Only} />)
    expect(screen.getByText('4 of 4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^finish$/i })).toBeInTheDocument()
  })
})
