// @vitest-environment node
// Pure logic — no DOM needed. Faster than the default jsdom env.
import { describe, it, expect } from 'vitest'
import {
  getConferenceLifecycleStatus,
  isActiveConference,
} from './lifecycle'

// Note: getConferenceLifecycleStatus uses now.toISOString().slice(0, 10), which
// is a UTC date. Tests construct `now` with `new Date('YYYY-MM-DDT12:00:00Z')`
// (noon UTC) so the UTC date matches the wall date and there's no ambiguity.
function utcNoon(date: string): Date {
  return new Date(`${date}T12:00:00Z`)
}

describe('getConferenceLifecycleStatus', () => {
  it('returns "draft" for draft status regardless of dates', () => {
    expect(
      getConferenceLifecycleStatus(
        { status: 'draft', start_date: '2020-01-01', end_date: '2020-01-02' },
        utcNoon('2026-04-30')
      )
    ).toBe('draft')

    expect(
      getConferenceLifecycleStatus(
        { status: 'draft', start_date: '2030-01-01', end_date: '2030-01-02' },
        utcNoon('2026-04-30')
      )
    ).toBe('draft')
  })

  it('returns "live" when published and today is inside [start, end]', () => {
    expect(
      getConferenceLifecycleStatus(
        {
          status: 'published',
          start_date: '2026-04-29',
          end_date: '2026-05-01',
        },
        utcNoon('2026-04-30')
      )
    ).toBe('live')
  })

  it('returns "live" on the first day (today === start_date)', () => {
    expect(
      getConferenceLifecycleStatus(
        {
          status: 'published',
          start_date: '2026-04-30',
          end_date: '2026-05-02',
        },
        utcNoon('2026-04-30')
      )
    ).toBe('live')
  })

  it('returns "live" on the last day (today === end_date)', () => {
    expect(
      getConferenceLifecycleStatus(
        {
          status: 'published',
          start_date: '2026-04-29',
          end_date: '2026-04-30',
        },
        utcNoon('2026-04-30')
      )
    ).toBe('live')
  })

  it('returns "live" when published but conference has not started yet', () => {
    // Per the comment in lifecycle.ts: published+future is treated as Live's
    // sibling under the "Active" section — function returns 'live'.
    expect(
      getConferenceLifecycleStatus(
        {
          status: 'published',
          start_date: '2026-05-15',
          end_date: '2026-05-17',
        },
        utcNoon('2026-04-30')
      )
    ).toBe('live')
  })

  it('returns "past" when published and today > end_date', () => {
    expect(
      getConferenceLifecycleStatus(
        {
          status: 'published',
          start_date: '2026-04-01',
          end_date: '2026-04-29',
        },
        utcNoon('2026-04-30')
      )
    ).toBe('past')
  })
})

describe('isActiveConference', () => {
  it('treats drafts as active', () => {
    expect(
      isActiveConference(
        { status: 'draft', start_date: '2020-01-01', end_date: '2020-01-02' },
        utcNoon('2026-04-30')
      )
    ).toBe(true)
  })

  it('treats live as active', () => {
    expect(
      isActiveConference(
        {
          status: 'published',
          start_date: '2026-04-29',
          end_date: '2026-05-01',
        },
        utcNoon('2026-04-30')
      )
    ).toBe(true)
  })

  it('treats past as not active', () => {
    expect(
      isActiveConference(
        {
          status: 'published',
          start_date: '2026-04-01',
          end_date: '2026-04-29',
        },
        utcNoon('2026-04-30')
      )
    ).toBe(false)
  })
})
