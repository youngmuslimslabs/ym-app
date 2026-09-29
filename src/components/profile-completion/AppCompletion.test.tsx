import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompletionProvider } from './CompletionProvider'
import { AppCompletion, GatedContent } from './AppCompletion'
import type { ProfileCompletion } from '@/lib/profile-completion'

const mockFetchProfileCompletedAt = vi.fn()
const mockFetchCurrentUserProfile = vi.fn()
vi.mock('@/lib/supabase/queries/profile', () => ({
  fetchProfileCompletedAt: () => mockFetchProfileCompletedAt(),
  fetchCurrentUserProfile: () => mockFetchCurrentUserProfile(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

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
      // A raw <a> is intentional here: this test asserts a plain navigation link
      // is NOT intercepted by the gate. Swapping in next/link would defeat it.
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href="/people" onClick={(e) => { e.preventDefault(); onClick() }}>
        People
      </a>,
    )
    await user.click(screen.getByRole('link', { name: 'People' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

describe('AppCompletion (mount stability + lazy profile fetch)', () => {
  beforeEach(() => {
    mockFetchProfileCompletedAt.mockReset()
    mockFetchCurrentUserProfile.mockReset()
    mockFetchCurrentUserProfile.mockResolvedValue({ data: null, error: null })
  })

  function MountCounter({ onMount }: { onMount: () => void }) {
    useEffect(onMount, [onMount])
    return <button>Action</button>
  }

  it('does not remount the page when the completion flag arrives', async () => {
    let resolveFlag: (v: { completedAt: string | null; errored: boolean }) => void = () => {}
    mockFetchProfileCompletedAt.mockReturnValue(new Promise((r) => { resolveFlag = r }))
    const onMount = vi.fn()

    // An empty profile computes as incomplete, so the gate + strip switch on.
    mockFetchCurrentUserProfile.mockResolvedValue({ data: {}, error: null })

    render(<AppCompletion><MountCounter onMount={onMount} /></AppCompletion>)
    expect(onMount).toHaveBeenCalledTimes(1)

    resolveFlag({ completedAt: null, errored: false })
    await waitFor(() => expect(screen.getByText(/finish setting up/i)).toBeInTheDocument())
    expect(onMount).toHaveBeenCalledTimes(1)
  })

  it('skips the full profile fetch for a completed profile', async () => {
    mockFetchProfileCompletedAt.mockResolvedValue({ completedAt: '2026-07-01T00:00:00Z', errored: false })
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<AppCompletion><button onClick={onClick}>Check in</button></AppCompletion>)
    await waitFor(() => expect(mockFetchProfileCompletedAt).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(mockFetchCurrentUserProfile).not.toHaveBeenCalled()
  })

  it('fails open when the flag fetch errors', async () => {
    mockFetchProfileCompletedAt.mockResolvedValue({ completedAt: null, errored: true })
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<AppCompletion><button onClick={onClick}>Check in</button></AppCompletion>)
    await waitFor(() => expect(mockFetchProfileCompletedAt).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Check in' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(mockFetchCurrentUserProfile).not.toHaveBeenCalled()
  })
})
