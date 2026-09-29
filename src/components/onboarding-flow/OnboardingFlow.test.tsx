import { afterEach, describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { OnboardingFlow } from './OnboardingFlow'

type User = ReturnType<typeof userEvent.setup>

// Step 1 is the Brothers/Sisters question; most tests start past it.
async function chooseSide(user: User, side: 'Brothers' | 'Sisters' = 'Brothers') {
  await user.click(screen.getByRole('radio', { name: side }))
  await user.click(screen.getByRole('button', { name: /continue/i }))
}

afterEach(() => {
  document.documentElement.removeAttribute('data-theme-side')
})

describe('OnboardingFlow — Brothers/Sisters step', () => {
  it('lands directly on the side question — no welcome/intro screen', () => {
    render(<OnboardingFlow />)
    expect(screen.getByText('Which side are you part of?')).toBeInTheDocument()
    expect(screen.getByText(/can’t be changed later/i)).toBeInTheDocument()
    expect(screen.queryByText(/set up your profile/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /get started/i })).not.toBeInTheDocument()
  })

  it('requires a choice, and picking one does not auto-advance', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Sisters' }))
    expect(screen.getByRole('radio', { name: 'Sisters' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Which side are you part of?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('previews the chosen theme on <html>', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await user.click(screen.getByRole('radio', { name: 'Sisters' }))
    expect(document.documentElement).toHaveAttribute('data-theme-side', 'sisters')
  })

  it('moves on to the phone question after Continue', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
  })
})

describe('OnboardingFlow (Part 1 wiring)', () => {

  it('gates the phone step on a VALID phone number, not just non-empty', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '555')
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    await user.type(screen.getByRole('textbox'), '1112222')
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('auto-formats the phone number as it is typed', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '5551112222')
    expect(screen.getByRole('textbox')).toHaveValue('(555) 111-2222')
  })

  it('nationality combobox shows the whole list without typing (not capped at ~50)', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
    expect(screen.getByText("What's your nationality?")).toBeInTheDocument()
    await user.click(screen.getByRole('combobox'))
    // "Pakistani" sits well past the old 50-item cap (alphabetically far after "D").
    // Before the fix it was hidden until you typed; it must now be visible directly.
    expect(await screen.findByRole('option', { name: 'Pakistani' })).toBeInTheDocument()
  })

  it('Back returns to the previous step with the value preserved', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    // now on email
    expect(screen.getByText(/personal email/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('(555) 111-2222')
  })

  it('lets you proceed from an already-answered single-select after going Back (no re-selection needed)', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
    // ethnicity → pick one → auto-advances to DOB
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'American' }))
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
    // go Back to the answered ethnicity screen
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByText("What's your nationality?")).toBeInTheDocument()
    // without changing the selection, Continue must move forward
    const cta = screen.getByRole('button', { name: /continue/i })
    expect(cta).toBeEnabled()
    await user.click(cta)
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
  })

  it('a single-select (ethnicity) auto-advances to the date-of-birth step', async () => {
    const user = userEvent.setup()
    render(<OnboardingFlow />)
    await chooseSide(user)
    await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
    await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
    expect(screen.getByText("What's your nationality?")).toBeInTheDocument()
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'American' }))
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
  })
})
