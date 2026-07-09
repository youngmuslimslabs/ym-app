import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OnboardingFlow } from './OnboardingFlow'

describe('OnboardingFlow (Part 1 wiring)', () => {
  it('starts on the welcome screen', () => {
    render(<OnboardingFlow />)
    expect(screen.getByText(/Let.s set up your profile/)).toBeInTheDocument()
  })

  it('advances from welcome to the phone question on Get started', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
  })

  it('Back returns to the previous step', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.click(screen.getByRole('button', { name: /get started/i }))
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText(/Let.s set up your profile/)).toBeInTheDocument()
  })

  it('a single-choice answer auto-advances to the next step', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    // welcome -> phone -> email -> ethnicity
    await user.click(screen.getByRole('button', { name: /get started/i }))
    await user.type(screen.getByRole('textbox'), '(555) 111-2222{Enter}')
    await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
    expect(screen.getByText('How do you identify?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Arab' }))
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
  })
})
