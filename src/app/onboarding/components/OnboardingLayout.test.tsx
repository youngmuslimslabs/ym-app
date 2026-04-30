import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OnboardingLayout } from './OnboardingLayout'

const mockSaveStepInBackground = vi.fn()
const mockClearPendingSaveError = vi.fn()
let mockPendingSaveError: { step: number; error: string; data: object } | null = null

vi.mock('@/contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    pendingSaveError: mockPendingSaveError,
    saveStepInBackground: mockSaveStepInBackground,
    clearPendingSaveError: mockClearPendingSaveError,
  }),
}))

describe('OnboardingLayout', () => {
  beforeEach(() => {
    mockPendingSaveError = null
    mockSaveStepInBackground.mockReset()
    mockClearPendingSaveError.mockReset()
  })

  it('disables Next when isValid is false', () => {
    render(
      <OnboardingLayout step={1} isValid={false} onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables Next when isValid is true', () => {
    render(
      <OnboardingLayout step={1} isValid={true} onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled()
  })

  it('disables Next while saving and shows Saving label', () => {
    render(
      <OnboardingLayout step={1} isValid={true} isSaving onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    const next = screen.getByRole('button', { name: /saving/i })
    expect(next).toBeDisabled()
  })

  it('disables Next while loading', () => {
    render(
      <OnboardingLayout step={1} isValid={true} isLoading onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('hides Back on step 1 by default', () => {
    render(
      <OnboardingLayout step={1} onNext={() => {}} onBack={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('shows Back on step 2+', () => {
    render(
      <OnboardingLayout step={2} onNext={() => {}} onBack={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('renders error message when provided', () => {
    render(
      <OnboardingLayout step={1} error="Network down" onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByText('Network down')).toBeInTheDocument()
  })

  it('uses custom nextButtonText', () => {
    render(
      <OnboardingLayout step={7} isValid nextButtonText="Complete" onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
  })

  it('shows pendingSaveError banner and retry triggers a re-save', async () => {
    mockPendingSaveError = { step: 3, error: 'fail', data: { skills: ['leadership'] } }
    const user = userEvent.setup()

    render(
      <OnboardingLayout step={4} isValid onNext={() => {}}>
        <div>content</div>
      </OnboardingLayout>,
    )

    expect(screen.getByText(/We saved your work in this browser/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry save/i }))

    expect(mockClearPendingSaveError).toHaveBeenCalledOnce()
    expect(mockSaveStepInBackground).toHaveBeenCalledWith(3, { skills: ['leadership'] })
  })
})
