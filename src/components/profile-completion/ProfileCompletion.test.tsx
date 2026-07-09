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

  it('shows resolved count out of six from the data', () => {
    // only skills filled -> 1 of 6
    render(<ProfileCompletion initialData={{ skills: ['a', 'b', 'c'] }} />)
    expect(screen.getByText('1 of 6')).toBeInTheDocument()
  })

  it('offers "Save & continue later" while incomplete', () => {
    render(<ProfileCompletion initialData={{}} />)
    expect(
      screen.getByRole('button', { name: /save & continue later/i }),
    ).toBeInTheDocument()
  })

  it('offers "Finish" and shows 6 of 6 when everything is resolved', () => {
    render(<ProfileCompletion initialData={completeData} />)
    expect(screen.getByText('6 of 6')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^finish$/i })).toBeInTheDocument()
  })
})
