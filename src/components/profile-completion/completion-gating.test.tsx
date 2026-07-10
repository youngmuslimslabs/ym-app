import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { computeProfileCompletion } from '@/lib/profile-completion'
import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'

import { CompletionGate } from './CompletionGate'
import { CompletionProvider, useCompletion } from './CompletionProvider'

const COMPLETE: ProfileFormState = {
  phoneNumber: 'x',
  personalEmail: 'x',
  ethnicity: 'x',
  dateOfBirth: new Date(),
  neighborNetId: 'nn',
  ymRoles: [{ id: 'r', isCurrent: true, roleTypeId: 'a', startMonth: 1, startYear: 2020 }],
  ymProjects: [{ id: 'p', isCurrent: false, projectType: 'x', startMonth: 1, startYear: 2020 }],
  educationLevel: 'high-school-graduate',
  skills: ['a', 'b', 'c'],
}

describe('CompletionGate', () => {
  it('names the blocked action and exposes both actions', () => {
    render(
      <CompletionGate open action="check in" onDismiss={vi.fn()} onGoToComplete={vi.fn()} />,
    )
    expect(screen.getByText(/complete your profile to check in/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /complete my profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument()
  })

  it('routes to completion on "Complete my profile"', async () => {
    const onGo = vi.fn()
    const user = userEvent.setup()
    render(<CompletionGate open action="check in" onDismiss={vi.fn()} onGoToComplete={onGo} />)
    await user.click(screen.getByRole('button', { name: /complete my profile/i }))
    expect(onGo).toHaveBeenCalledOnce()
  })
})

function Consumer({ proceed }: { proceed: () => void }) {
  const { requireComplete } = useCompletion()
  return <button onClick={() => requireComplete('check in', proceed)}>Check in</button>
}

describe('CompletionProvider.requireComplete', () => {
  it('runs the action immediately when the profile is complete', async () => {
    const proceed = vi.fn()
    const user = userEvent.setup()
    render(
      <CompletionProvider completion={computeProfileCompletion(COMPLETE)} onGoToComplete={vi.fn()}>
        <Consumer proceed={proceed} />
      </CompletionProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(proceed).toHaveBeenCalledOnce()
    expect(screen.queryByText(/complete your profile to check in/i)).not.toBeInTheDocument()
  })

  it('blocks the action and opens the gate when incomplete', async () => {
    const proceed = vi.fn()
    const user = userEvent.setup()
    render(
      <CompletionProvider completion={computeProfileCompletion({})} onGoToComplete={vi.fn()}>
        <Consumer proceed={proceed} />
      </CompletionProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(proceed).not.toHaveBeenCalled()
    expect(screen.getByText(/complete your profile to check in/i)).toBeInTheDocument()
  })
})
