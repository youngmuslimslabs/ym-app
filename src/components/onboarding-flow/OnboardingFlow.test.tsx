import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OnboardingFlow } from './OnboardingFlow'

describe('OnboardingFlow (Part 1 wiring)', () => {
  it('lands directly on the phone question — no welcome/intro screen', () => {
    render(<OnboardingFlow />)
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
    expect(screen.queryByText(/set up your profile/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument()
  })

  it('gates the phone step on a VALID phone number, not just non-empty', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.type(screen.getByRole('textbox'), '555')
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    await user.type(screen.getByRole('textbox'), '1112222')
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('auto-formats the phone number as it is typed', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.type(screen.getByRole('textbox'), '5551112222')
    expect(screen.getByRole('textbox')).toHaveValue('(555) 111-2222')
  })

  it('Back returns to the previous step with the value preserved', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    // now on email
    expect(screen.getByText(/personal email/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('(555) 111-2222')
  })

  it('a single-select (ethnicity) auto-advances to the date-of-birth step', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
    expect(screen.getByText('How do you identify?')).toBeInTheDocument()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Arab' }))
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
  })
})
