import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PersonalInfo from './step1-personal-info'

const mockPush = vi.fn()
const mockUpdateData = vi.fn()
const mockSaveStepInBackground = vi.fn()
type Step1Data = {
  phoneNumber?: string
  personalEmail?: string
  ethnicity?: string
  dateOfBirth?: Date
}
let mockData: Step1Data = {}

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

describe('Step1 — Personal Info', () => {
  beforeEach(() => {
    mockData = {}
    mockPush.mockReset()
    mockUpdateData.mockReset()
    mockSaveStepInBackground.mockReset()
  })

  it('disables Next on initial render (form invalid)', () => {
    render(<PersonalInfo />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('formats phone number as user types', async () => {
    const user = userEvent.setup()
    render(<PersonalInfo />)

    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement
    await user.type(phoneInput, '5551234567')
    expect(phoneInput.value).toBe('(555) 123-4567')
  })

  it('shows phone error after blur with invalid number', async () => {
    const user = userEvent.setup()
    render(<PersonalInfo />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '555')
    expect(screen.queryByText(/valid 10-digit phone/i)).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByText(/valid 10-digit phone/i)).toBeInTheDocument()
  })

  it('does not show phone error if input is empty after blur', async () => {
    const user = userEvent.setup()
    render(<PersonalInfo />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.click(phoneInput)
    await user.tab()
    expect(screen.queryByText(/valid 10-digit phone/i)).not.toBeInTheDocument()
  })

  it('shows email error after blur with invalid email', async () => {
    const user = userEvent.setup()
    render(<PersonalInfo />)

    const emailInput = screen.getByLabelText(/personal email/i)
    await user.type(emailInput, 'not-an-email')
    expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
  })

  it('clears phone error once a valid number is entered', async () => {
    const user = userEvent.setup()
    render(<PersonalInfo />)

    const phoneInput = screen.getByLabelText(/phone number/i)
    await user.type(phoneInput, '555')
    await user.tab()
    expect(screen.getByText(/valid 10-digit phone/i)).toBeInTheDocument()

    await user.click(phoneInput)
    await user.type(phoneInput, '1234567')
    expect(screen.queryByText(/valid 10-digit phone/i)).not.toBeInTheDocument()
  })

  it('pre-fills fields from context data', () => {
    mockData = {
      phoneNumber: '(555) 123-4567',
      personalEmail: 'user@example.com',
      ethnicity: 'pakistani',
      dateOfBirth: new Date('1995-06-15'),
    }
    render(<PersonalInfo />)

    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe(
      '(555) 123-4567',
    )
    expect((screen.getByLabelText(/personal email/i) as HTMLInputElement).value).toBe(
      'user@example.com',
    )
  })
})
