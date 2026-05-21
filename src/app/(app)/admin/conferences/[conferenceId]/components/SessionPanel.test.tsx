import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionPanel } from './SessionPanel'
import { makeConference } from './test-fixtures'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

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
})
