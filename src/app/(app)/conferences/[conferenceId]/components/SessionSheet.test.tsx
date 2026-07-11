import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionSheet } from './SessionSheet'
import type { Session } from '../types'

// useIsMobile reads window.matchMedia; jsdom lacks it. Minimal shim (desktop).
beforeAll(() => {
  if (!window.matchMedia) {
    // @ts-expect-error partial MediaQueryList is enough for useIsMobile
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })
  }
})

// Session runs 14:00–15:00 UTC; grace tail closes at 15:15 UTC.
const session: Session = {
  id: 's1',
  conference_id: 'c1',
  start_at: '2025-06-27T14:00:00Z',
  end_at: '2025-06-27T15:00:00Z',
  title: 'Keynote',
  description: null,
  speaker: null,
  room: null,
  is_break: false,
  capacity: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const baseProps = {
  session,
  timezone: 'UTC',
  signedUp: true,
  checkedIn: false,
  feedback: null,
  seatCount: 0,
  checkInError: null,
  pending: false,
  onClose: vi.fn(),
  onSignup: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn().mockResolvedValue(undefined),
  onCheckIn: vi.fn().mockResolvedValue(undefined),
  onSubmitFeedback: vi.fn().mockResolvedValue(undefined),
}

describe('SessionSheet check-in sticky latch', () => {
  it('keeps a half-typed check-in code when now ticks past the grace window', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <SessionSheet {...baseProps} now={new Date('2025-06-27T15:07:00Z')} />,
    )

    const input = screen.getByPlaceholderText('Enter code')
    await user.type(input, 'ABCD')
    expect(input).toHaveValue('ABCD')

    // A background `now` tick advances past end+15min while the user is mid-entry.
    rerender(<SessionSheet {...baseProps} now={new Date('2025-06-27T15:20:00Z')} />)

    // The form (and the typed code) survive; the "missed check-in" notice does
    // not preempt it.
    expect(screen.getByPlaceholderText('Enter code')).toHaveValue('ABCD')
    expect(screen.queryByText(/didn't check in/i)).not.toBeInTheDocument()
  })

  it('shows the missed notice when the sheet is first opened after the window closed', () => {
    render(<SessionSheet {...baseProps} now={new Date('2025-06-27T15:20:00Z')} />)
    expect(screen.getByText(/didn't check in/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Enter code')).not.toBeInTheDocument()
  })
})
