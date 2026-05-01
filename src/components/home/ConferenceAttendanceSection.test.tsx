import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import {
  ConferenceAttendanceSection,
  formatConferenceDateRange,
} from './ConferenceAttendanceSection'
import type { UpcomingAttendance } from '@/lib/supabase/queries'

const mockFetchUpcomingAttendance = vi.fn<
  (authId: string) => Promise<UpcomingAttendance | null>
>()

vi.mock('@/lib/supabase/queries', () => ({
  fetchUpcomingAttendance: (authId: string) =>
    mockFetchUpcomingAttendance(authId),
}))

async function renderAsync(node: Promise<React.ReactNode>) {
  const resolved = await node
  return render(<>{resolved}</>)
}

describe('formatConferenceDateRange', () => {
  it('renders a single date when start === end', () => {
    expect(formatConferenceDateRange('2026-05-02', '2026-05-02')).toBe('May 2')
  })

  it('omits the second month name when same month + same year', () => {
    expect(formatConferenceDateRange('2026-05-01', '2026-05-03')).toBe(
      'May 1 – 3',
    )
  })

  it('repeats the year-stripped month when crossing years', () => {
    expect(formatConferenceDateRange('2026-12-30', '2027-01-02')).toBe(
      'December 30 – January 2',
    )
  })

  it('repeats the month name when crossing months', () => {
    expect(formatConferenceDateRange('2026-04-30', '2026-05-02')).toBe(
      'April 30 – May 2',
    )
  })
})

describe('ConferenceAttendanceSection', () => {
  beforeEach(() => {
    mockFetchUpcomingAttendance.mockReset()
  })

  it('returns null when there is no upcoming attendance', async () => {
    mockFetchUpcomingAttendance.mockResolvedValue(null)
    const { container } = await renderAsync(
      ConferenceAttendanceSection({ userId: 'auth-1' }),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders eyebrow, name, dates, and a link to the conference', async () => {
    mockFetchUpcomingAttendance.mockResolvedValue({
      conferenceId: 'conf-123',
      name: 'YM Annual Conference 2026',
      startDate: '2026-04-30',
      endDate: '2026-05-02',
      isLive: false,
    })
    await renderAsync(ConferenceAttendanceSection({ userId: 'auth-1' }))

    expect(screen.getByText('Attending')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'YM Annual Conference 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('April 30 – May 2')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /view your schedule/i })
    expect(link).toHaveAttribute('href', '/conferences/conf-123')
  })

  it('animates the status dot only when the conference is live', async () => {
    mockFetchUpcomingAttendance.mockResolvedValueOnce({
      conferenceId: 'live-1',
      name: 'Live Conference',
      startDate: '2026-04-30',
      endDate: '2026-05-02',
      isLive: true,
    })
    const { container, unmount } = await renderAsync(
      ConferenceAttendanceSection({ userId: 'auth-1' }),
    )
    const liveDot = container.querySelector('span[aria-hidden="true"]')
    expect(liveDot).toHaveClass('animate-status-pulse')
    unmount()

    mockFetchUpcomingAttendance.mockResolvedValueOnce({
      conferenceId: 'soon-1',
      name: 'Upcoming Conference',
      startDate: '2026-05-14',
      endDate: '2026-05-16',
      isLive: false,
    })
    const upcoming = await renderAsync(
      ConferenceAttendanceSection({ userId: 'auth-1' }),
    )
    const upcomingDot = upcoming.container.querySelector(
      'span[aria-hidden="true"]',
    )
    expect(upcomingDot).not.toHaveClass('animate-status-pulse')
  })

  it('passes the auth user id through to the query', async () => {
    mockFetchUpcomingAttendance.mockResolvedValue(null)
    await renderAsync(ConferenceAttendanceSection({ userId: 'auth-xyz' }))
    expect(mockFetchUpcomingAttendance).toHaveBeenCalledWith('auth-xyz')
  })
})
