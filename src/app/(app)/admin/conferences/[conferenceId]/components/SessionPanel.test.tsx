import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionPanel } from './SessionPanel'
import { makeConference, makeSession } from './test-fixtures'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

// Supabase chain mock — view mode triggers loadRoster on mount. Return empty
// data for both queries so the request resolves without exercising real I/O.
vi.mock('@/lib/supabase/client', () => {
  const result = { data: [] as unknown[], error: null as null }
  type Builder = {
    select: () => Builder
    eq: () => Builder
    order: () => Promise<typeof result>
    then: <T>(onFulfilled?: (v: typeof result) => T | PromiseLike<T>) => Promise<T>
  }
  const builder: Builder = {
    select: () => builder,
    eq: () => builder,
    order: () => Promise.resolve(result),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled!),
  }
  return { createClient: () => ({ from: () => builder }) }
})

describe('SessionPanel', () => {
  it('shows empty state when mode is empty', () => {
    render(
      <SessionPanel
        conference={makeConference()}
        sessions={[]}
        signupCounts={{}}
        checkInCounts={{}}
        mode="empty"
        selectedSession={null}
        createDefaultDate={undefined}
        onModeChange={() => {}}
        onSaved={() => {}}
        onAfterDelete={() => {}}
        onDirtyChange={() => {}}
      />
    )
    expect(screen.getByText(/select a session/i)).toBeInTheDocument()
  })

  it('renders roster filter tabs in view mode for sessions', () => {
    const session = makeSession()
    render(
      <SessionPanel
        conference={makeConference()}
        sessions={[session]}
        signupCounts={{ s1: 12 }}
        checkInCounts={{ s1: 5 }}
        mode="view"
        selectedSession={session}
        createDefaultDate={undefined}
        onModeChange={() => {}}
        onSaved={() => {}}
        onAfterDelete={() => {}}
        onDirtyChange={() => {}}
      />
    )
    expect(screen.getByRole('tab', { name: /^all/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^checked in/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^not checked in/i })).toBeInTheDocument()
  })
})
