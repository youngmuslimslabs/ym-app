import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionCard } from './SessionCard'
import type { Session } from '../types'

// Session runs 14:00–15:00 UTC; grace tail closes at 16:00 UTC.
const session: Session = {
  id: 's1',
  conference_id: 'c1',
  start_at: '2025-06-27T14:00:00Z',
  end_at: '2025-06-27T15:00:00Z',
  title: 'Opening Keynote',
  description: null,
  speaker: 'Speaker',
  room: 'Main Hall',
  is_break: false,
  capacity: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const renderCard = (over: Partial<Parameters<typeof SessionCard>[0]>) =>
  render(
    <SessionCard
      session={session}
      signedUp
      checkedIn={false}
      seatCount={0}
      now={new Date('2025-06-27T15:07:00Z')}
      onSelect={vi.fn()}
      {...over}
    />,
  )

describe('SessionCard grace period', () => {
  it('during the grace tail, prompts "Check in now" (not the missed notice)', () => {
    renderCard({ now: new Date('2025-06-27T15:07:00Z') })
    expect(screen.getByText('Check in now')).toBeInTheDocument()
    expect(screen.queryByText("You didn't check in")).not.toBeInTheDocument()
  })

  it('once the grace window closes, shows "You didn\'t check in"', () => {
    renderCard({ now: new Date('2025-06-27T16:30:00Z') })
    expect(screen.getByText("You didn't check in")).toBeInTheDocument()
    expect(screen.queryByText('Check in now')).not.toBeInTheDocument()
  })

  it('during the session (before end), shows neither grace nor missed text', () => {
    renderCard({ now: new Date('2025-06-27T14:30:00Z') })
    expect(screen.queryByText('Check in now')).not.toBeInTheDocument()
    expect(screen.queryByText("You didn't check in")).not.toBeInTheDocument()
  })

  it('a checked-in attendee sees the "Checked in" badge, never the grace prompt', () => {
    renderCard({ checkedIn: true, now: new Date('2025-06-27T15:07:00Z') })
    expect(screen.getByText('Checked in')).toBeInTheDocument()
    expect(screen.queryByText('Check in now')).not.toBeInTheDocument()
  })

  it('checked in + ended + no feedback yet → "Leave feedback"', () => {
    renderCard({ checkedIn: true, now: new Date('2025-06-27T16:30:00Z') })
    expect(screen.getByText('Leave feedback')).toBeInTheDocument()
  })

  it('renders the submitted rating once feedback exists', () => {
    renderCard({
      checkedIn: true,
      feedback: { rating: 4, comment: null },
      now: new Date('2025-06-27T16:30:00Z'),
    })
    expect(screen.getByText('4/5')).toBeInTheDocument()
    expect(screen.queryByText('Leave feedback')).not.toBeInTheDocument()
  })
})

describe('SessionCard chrome (bright while an action is wanted)', () => {
  const card = () => screen.getByRole('button')

  it('grace tail, not checked in → keeps "Signed up" badge, stays bright', () => {
    renderCard({ now: new Date('2025-06-27T15:07:00Z') })
    expect(screen.getByText('Signed up')).toBeInTheDocument()
    expect(card().className).toContain('border-primary')
    expect(card().className).not.toContain('opacity-70')
  })

  it('checked in + ended + feedback pending → not dimmed', () => {
    renderCard({ checkedIn: true, now: new Date('2025-06-27T16:30:00Z') })
    expect(screen.getByText('Leave feedback')).toBeInTheDocument()
    expect(card().className).not.toContain('opacity-70')
  })

  it('feedback submitted → dims (nothing left to ask)', () => {
    renderCard({
      checkedIn: true,
      feedback: { rating: 4, comment: null },
      now: new Date('2025-06-27T16:30:00Z'),
    })
    expect(card().className).toContain('opacity-70')
  })

  it('missed check-in past grace → dims and badge is gone', () => {
    renderCard({ now: new Date('2025-06-27T16:30:00Z') })
    expect(card().className).toContain('opacity-70')
    expect(screen.queryByText('Signed up')).not.toBeInTheDocument()
  })

  it('not signed up, grace tail → stays joinable (clickable, not dimmed)', () => {
    renderCard({ signedUp: false, now: new Date('2025-06-27T15:07:00Z') })
    expect(card().className).toContain('cursor-pointer')
    expect(card().className).not.toContain('opacity-70')
    expect(card()).toHaveAccessibleName('Opening Keynote — available')
  })

  it('not signed up, past grace → dimmed, loses the join affordance, announces "ended"', async () => {
    const onSelect = vi.fn()
    renderCard({ signedUp: false, now: new Date('2025-06-27T16:30:00Z'), onSelect })
    expect(card().className).toContain('opacity-70')
    expect(card().className).not.toContain('cursor-pointer')
    expect(card()).toHaveAccessibleName('Opening Keynote — ended')
    // Still opens the sheet for details — the dead end is communicated there.
    const user = userEvent.setup()
    await user.click(card())
    expect(onSelect).toHaveBeenCalled()
  })

  it('not signed up + full, grace tail → dimmed and never joinable', () => {
    renderCard({
      session: { ...session, capacity: 1 },
      seatCount: 1,
      signedUp: false,
      now: new Date('2025-06-27T15:07:00Z'),
    })
    // tailwind-merge keeps the later opacity-70 (ended dim) over full's
    // opacity-60 — either way the card must read as dimmed, not joinable.
    expect(card().className).toContain('opacity-70')
    expect(card().className).toContain('cursor-not-allowed')
    expect(card().className).not.toContain('cursor-pointer')
    expect(card()).toHaveAccessibleName('Opening Keynote — full')
  })
})
