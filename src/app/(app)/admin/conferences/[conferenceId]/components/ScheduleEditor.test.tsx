import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScheduleEditor } from './ScheduleEditor'
import { makeConference, makeSession } from './test-fixtures'
import type { ConferenceEditorView } from '../../types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

// Empty Supabase stub — view mode triggers loadRoster on mount
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

function makeView(
  overrides: Partial<ConferenceEditorView> = {}
): ConferenceEditorView {
  return {
    conference: makeConference(),
    sessions: [
      makeSession({
        id: 's1',
        title: 'Opening Keynote',
        start_at: '2026-06-01T13:00:00Z',
        end_at: '2026-06-01T14:00:00Z',
      }),
    ],
    signupCounts: { s1: 0 },
    checkInCounts: { s1: 0 },
    feedbackBySession: {},
    invitedCount: 0,
    feedbackCount: 0,
    attendees: { people: [], filterCategories: [], invitedUserIds: [] },
    ...overrides,
  }
}

describe('ScheduleEditor', () => {
  it('opens view panel when a row is clicked', () => {
    render(<ScheduleEditor view={makeView()} />)
    // "Select a session" is the empty-state copy from SessionPanel
    expect(screen.getByText(/select a session/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /opening keynote/i }))
    expect(screen.queryByText(/select a session/i)).not.toBeInTheDocument()
  })

  it('shows conference empty state when there are no sessions', () => {
    render(<ScheduleEditor view={makeView({ sessions: [], signupCounts: {}, checkInCounts: {} })} />)
    expect(screen.getByText(/no sessions yet/i)).toBeInTheDocument()
    // Should NOT also show the panel-level empty state
    expect(screen.queryByText(/select a session/i)).not.toBeInTheDocument()
  })
})
