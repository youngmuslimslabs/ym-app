import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompletionProvider } from './CompletionProvider'
import { GatedContent } from './AppCompletion'
import type { ProfileCompletion } from '@/lib/profile-completion'

const INCOMPLETE: ProfileCompletion = {
  sections: {
    personal: 'done',
    location: 'done',
    roles: 'todo',
    projects: 'todo',
    education: 'todo',
    skills: 'todo',
  },
  resolvedCount: 2,
  total: 6,
  percent: 33,
  isComplete: false,
}

function renderGated(child: React.ReactNode) {
  return render(
    <CompletionProvider completion={INCOMPLETE} onGoToComplete={vi.fn()}>
      <GatedContent>{child}</GatedContent>
    </CompletionProvider>,
  )
}

describe('GatedContent (uniform action gate while incomplete)', () => {
  it('blocks a content button — its onClick never fires', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    renderGated(<button onClick={onClick}>Check in</button>)
    await user.click(screen.getByRole('button', { name: 'Check in' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('blocks a role="button" element too', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    renderGated(
      <div role="button" tabIndex={0} onClick={onClick}>
        RSVP
      </div>,
    )
    await user.click(screen.getByRole('button', { name: 'RSVP' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does NOT block a plain navigation link (browsing stays free)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    renderGated(
      <a href="/people" onClick={(e) => { e.preventDefault(); onClick() }}>
        People
      </a>,
    )
    await user.click(screen.getByRole('link', { name: 'People' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
