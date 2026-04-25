import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Step6 from './step6-skills'

const mockPush = vi.fn()
const mockUpdateData = vi.fn()
const mockSaveStepInBackground = vi.fn()
let mockData: { skills?: string[] } = {}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    data: mockData,
    updateData: mockUpdateData,
    saveStepInBackground: mockSaveStepInBackground,
    pendingSaveError: null,
    clearPendingSaveError: vi.fn(),
    isLoading: false,
  }),
}))

describe('Step6 — Skills', () => {
  beforeEach(() => {
    mockData = {}
    mockPush.mockReset()
    mockUpdateData.mockReset()
    mockSaveStepInBackground.mockReset()
  })

  it('disables Next when fewer than 3 skills selected', () => {
    render(<Step6 />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables Next once 3 skills are selected', async () => {
    const user = userEvent.setup()
    render(<Step6 />)

    await user.click(screen.getByText('Leadership'))
    await user.click(screen.getByText('Public Speaking'))
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()

    await user.click(screen.getByText('Project Management'))
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })

  it('toggling a selected skill deselects it', async () => {
    const user = userEvent.setup()
    render(<Step6 />)

    const leadership = screen.getByText('Leadership')
    await user.click(leadership)
    await user.click(screen.getByText('Public Speaking'))
    await user.click(screen.getByText('Project Management'))
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()

    await user.click(leadership)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('pre-fills selections from context data on mount', () => {
    mockData = { skills: ['leadership', 'public-speaking', 'fundraising'] }
    render(<Step6 />)
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })

  it('handleNext saves and pushes to step 7', async () => {
    const user = userEvent.setup()
    render(<Step6 />)

    await user.click(screen.getByText('Leadership'))
    await user.click(screen.getByText('Marketing'))
    await user.click(screen.getByText('Writing'))
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(mockUpdateData).toHaveBeenCalledWith({
      skills: ['leadership', 'marketing', 'writing'],
    })
    expect(mockSaveStepInBackground).toHaveBeenCalledWith(6, {
      skills: ['leadership', 'marketing', 'writing'],
    })
    expect(mockPush).toHaveBeenCalledWith('/onboarding?step=7')
  })

  it('handleBack saves and pushes to step 5', async () => {
    mockData = { skills: ['leadership', 'fundraising', 'mentoring'] }
    const user = userEvent.setup()
    render(<Step6 />)

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(mockSaveStepInBackground).toHaveBeenCalledWith(6, {
      skills: ['leadership', 'fundraising', 'mentoring'],
    })
    expect(mockPush).toHaveBeenCalledWith('/onboarding?step=5')
  })
})
