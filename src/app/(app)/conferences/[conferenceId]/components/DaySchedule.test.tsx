import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DaySchedule, currentBlockKey, groupSessions } from './DaySchedule'
import type { Session } from '../types'

const TZ = 'America/Chicago'

// Friday and Saturday sessions (Chicago is UTC-5 in June).
const at = (id: string, title: string, start: string, end: string): Session => ({
  id,
  conference_id: 'c1',
  start_at: start,
  end_at: end,
  title,
  description: null,
  speaker: null,
  room: null,
  is_break: false,
  capacity: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
})
const SESSIONS = [
  at('f1', 'Friday Opening', '2025-06-27T14:00:00Z', '2025-06-27T15:00:00Z'),
  at('f2', 'Friday Night', '2025-06-28T00:00:00Z', '2025-06-28T01:00:00Z'),
  at('s1', 'Saturday Morning', '2025-06-28T14:00:00Z', '2025-06-28T15:00:00Z'),
  at('s2', 'Saturday Afternoon', '2025-06-28T19:00:00Z', '2025-06-28T20:00:00Z'),
]
// Saturday 11:30 AM Chicago: Friday is over, Saturday Morning has ended,
// Saturday Afternoon is next.
const SAT_MIDDAY = new Date('2025-06-28T16:30:00Z')

const renderSchedule = (now: Date) =>
  render(
    <DaySchedule
      sessions={SESSIONS}
      signupCounts={{}}
      mySignupSessionIds={new Set()}
      myCheckInSessionIds={new Set()}
      myFeedback={{}}
      timezone={TZ}
      now={now}
      onSelectSession={vi.fn()}
    />,
  )

describe('DaySchedule moves with time (#68)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('collapses a day that has fully ended, and opens it on tap', async () => {
    const user = userEvent.setup()
    renderSchedule(SAT_MIDDAY)
    expect(screen.queryByText('Friday Opening')).not.toBeInTheDocument()
    expect(screen.getByText('Saturday Afternoon')).toBeInTheDocument()

    const friday = screen.getByRole('button', { name: /Friday, June 27/ })
    expect(friday).toHaveAttribute('aria-expanded', 'false')
    expect(friday).toHaveTextContent('2 sessions · Ended')
    await user.click(friday)
    expect(screen.getByText('Friday Opening')).toBeInTheDocument()
  })

  it("keeps a day open while its last session's check-in grace window is still open", () => {
    // Saturday's last session ends 20:00Z; 30 minutes later check-in is still open.
    renderSchedule(new Date('2025-06-28T20:30:00Z'))
    expect(screen.getByText('Saturday Afternoon')).toBeInTheDocument()
    // An open day has no collapse toggle (that only appears once it's ended).
    expect(screen.queryByRole('button', { name: /Saturday, June 28/ })).not.toBeInTheDocument()
  })

  it('collapses the day once the grace window has closed', () => {
    // 61 minutes after the last session ends.
    renderSchedule(new Date('2025-06-28T21:01:00Z'))
    expect(screen.queryByText('Saturday Afternoon')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Saturday, June 28/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('labels the current day "Today"', () => {
    renderSchedule(SAT_MIDDAY)
    expect(screen.getByRole('heading', { name: /Today · Saturday, June 28/ })).toBeInTheDocument()
  })

  it('shows every day open before the conference starts', () => {
    renderSchedule(new Date('2025-06-20T12:00:00Z'))
    expect(screen.getByText('Friday Opening')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Friday, June 27/ })).not.toBeInTheDocument()
  })

  it('jumps to the block that is on now or next', () => {
    renderSchedule(SAT_MIDDAY)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })
})

describe('currentBlockKey', () => {
  const days = groupSessions(SESSIONS, TZ)

  it('is the first block that has not ended', () => {
    expect(currentBlockKey(days, SAT_MIDDAY.getTime())).toBe(
      `schedule-block-${Date.parse('2025-06-28T19:00:00Z')}-${Date.parse('2025-06-28T20:00:00Z')}`,
    )
  })

  it('is the live block while a session is on', () => {
    expect(currentBlockKey(days, Date.parse('2025-06-28T14:30:00Z'))).toBe(
      `schedule-block-${Date.parse('2025-06-28T14:00:00Z')}-${Date.parse('2025-06-28T15:00:00Z')}`,
    )
  })

  it('is null before the conference starts and after it ends', () => {
    expect(currentBlockKey(days, Date.parse('2025-06-20T12:00:00Z'))).toBeNull()
    expect(currentBlockKey(days, Date.parse('2025-07-01T12:00:00Z'))).toBeNull()
  })
})
