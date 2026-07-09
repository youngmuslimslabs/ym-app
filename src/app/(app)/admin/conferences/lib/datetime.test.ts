// @vitest-environment node
// Pure logic — no DOM needed. Faster than the default jsdom env.
import { describe, it, expect } from 'vitest'
import {
  composeSessionIsos,
  composeTzIso,
  dateRangeInclusive,
  decomposeTzIso,
  nextDay,
} from './datetime'

describe('composeTzIso', () => {
  it('handles EST (winter, no DST)', () => {
    expect(composeTzIso('2026-01-15', '14:30', 'America/New_York')).toBe(
      '2026-01-15T19:30:00.000Z'
    )
  })

  it('handles EDT (summer, DST)', () => {
    expect(composeTzIso('2026-07-15', '14:30', 'America/New_York')).toBe(
      '2026-07-15T18:30:00.000Z'
    )
  })

  it('handles PST (winter)', () => {
    expect(composeTzIso('2026-01-15', '09:00', 'America/Los_Angeles')).toBe(
      '2026-01-15T17:00:00.000Z'
    )
  })

  it('handles PDT (summer)', () => {
    expect(composeTzIso('2026-07-15', '09:00', 'America/Los_Angeles')).toBe(
      '2026-07-15T16:00:00.000Z'
    )
  })

  it('handles Phoenix (no DST year-round)', () => {
    // Phoenix stays at MST (UTC-7) all year — no spring forward
    expect(composeTzIso('2026-01-15', '14:30', 'America/Phoenix')).toBe(
      '2026-01-15T21:30:00.000Z'
    )
    expect(composeTzIso('2026-07-15', '14:30', 'America/Phoenix')).toBe(
      '2026-07-15T21:30:00.000Z'
    )
  })

  it('handles midnight without rolling the date', () => {
    expect(composeTzIso('2026-06-01', '00:00', 'America/New_York')).toBe(
      '2026-06-01T04:00:00.000Z'
    )
  })

  it('handles times that cross UTC day boundary', () => {
    // 22:00 EDT on July 15 = 02:00 UTC on July 16
    expect(composeTzIso('2026-07-15', '22:00', 'America/New_York')).toBe(
      '2026-07-16T02:00:00.000Z'
    )
  })

  it('throws on invalid date or time input', () => {
    // Note: V8's Date.parse is lenient about overflowing days (e.g. Feb 30
    // rolls to March 2 instead of returning NaN), so we only assert on
    // inputs that reliably return NaN across engines: malformed strings,
    // out-of-range hours, and month > 12.
    expect(() =>
      composeTzIso('not-a-date', '14:30', 'America/New_York')
    ).toThrow(/Invalid date\/time/)
    expect(() =>
      composeTzIso('2026-13-15', '14:30', 'America/New_York')
    ).toThrow(/Invalid date\/time/)
    expect(() =>
      composeTzIso('2026-01-15', '25:00', 'America/New_York')
    ).toThrow(/Invalid date\/time/)
  })

  it('handles spring-forward boundary (03:30 EDT is 07:30Z, not 08:30Z)', () => {
    // 03:30 on 2026-03-08 in NY is unambiguously EDT (DST started at 02:00).
    // Two-pass offset resolution samples EDT (-4) at the candidate instant,
    // returning 07:30Z rather than the pre-transition EST (-5) 08:30Z.
    expect(
      composeTzIso('2026-03-08', '03:30', 'America/New_York')
    ).toBe('2026-03-08T07:30:00.000Z')
  })

  it('handles fall-back boundary (01:30 EDT is 05:30Z)', () => {
    // On 2026-11-01 at 02:00 EDT, clocks fall back to 01:00 EST. 01:30 is
    // ambiguous — either 01:30 EDT (05:30Z) or 01:30 EST (06:30Z). We treat
    // the input as the first (pre-transition) occurrence.
    expect(
      composeTzIso('2026-11-01', '01:30', 'America/New_York')
    ).toBe('2026-11-01T05:30:00.000Z')
  })
})

describe('decomposeTzIso', () => {
  it('decomposes EST winter ISO', () => {
    expect(
      decomposeTzIso('2026-01-15T19:30:00.000Z', 'America/New_York')
    ).toEqual({ date: '2026-01-15', time: '14:30' })
  })

  it('decomposes EDT summer ISO', () => {
    expect(
      decomposeTzIso('2026-07-15T18:30:00.000Z', 'America/New_York')
    ).toEqual({ date: '2026-07-15', time: '14:30' })
  })

  it('decomposes across UTC day boundary, returns local date', () => {
    // 02:00 UTC on July 16 = 22:00 EDT on July 15
    expect(
      decomposeTzIso('2026-07-16T02:00:00.000Z', 'America/New_York')
    ).toEqual({ date: '2026-07-15', time: '22:00' })
  })

  it('decomposes PST', () => {
    expect(
      decomposeTzIso('2026-01-15T17:00:00.000Z', 'America/Los_Angeles')
    ).toEqual({ date: '2026-01-15', time: '09:00' })
  })
})

describe('compose/decompose round-trip', () => {
  // For non-DST-transition wall clocks, the two functions should be inverses.
  // (DST transition days have an inherent ambiguity for wall clocks in the
  // missing/duplicated hour — not exercised here.)
  it('round-trips a winter EST wall clock', () => {
    const iso = composeTzIso('2026-01-15', '14:30', 'America/New_York')
    expect(decomposeTzIso(iso, 'America/New_York')).toEqual({
      date: '2026-01-15',
      time: '14:30',
    })
  })

  it('round-trips a summer EDT wall clock', () => {
    const iso = composeTzIso('2026-07-15', '14:30', 'America/New_York')
    expect(decomposeTzIso(iso, 'America/New_York')).toEqual({
      date: '2026-07-15',
      time: '14:30',
    })
  })

  it('round-trips a Phoenix wall clock (no DST)', () => {
    const iso = composeTzIso('2026-07-15', '14:30', 'America/Phoenix')
    expect(decomposeTzIso(iso, 'America/Phoenix')).toEqual({
      date: '2026-07-15',
      time: '14:30',
    })
  })
})

describe('composeSessionIsos', () => {
  it('keeps end on the same day by default', () => {
    expect(
      composeSessionIsos('2026-07-15', '09:00', '10:30', 'America/New_York')
    ).toEqual({
      startIso: '2026-07-15T13:00:00.000Z',
      endIso: '2026-07-15T14:30:00.000Z',
    })
  })

  it('rolls end to the next day when endsNextDay is true', () => {
    expect(
      composeSessionIsos('2026-07-15', '23:00', '01:00', 'America/New_York', true)
    ).toEqual({
      startIso: '2026-07-16T03:00:00.000Z',
      endIso: '2026-07-16T05:00:00.000Z',
    })
  })

  it('rolls next day across a month boundary when endsNextDay is true', () => {
    expect(
      composeSessionIsos('2026-07-31', '23:30', '00:30', 'America/New_York', true)
    ).toEqual({
      startIso: '2026-08-01T03:30:00.000Z',
      endIso: '2026-08-01T04:30:00.000Z',
    })
  })

  it('does NOT interpret endTime < startTime as an implicit next-day roll', () => {
    // Reversed-time typo: admin types end=08:00 for a 09:00-start session.
    // The old inference behavior would silently roll to next day and persist
    // a ~23h session; the explicit endsNextDay=false must respect the input.
    expect(
      composeSessionIsos('2026-07-15', '09:00', '08:00', 'America/New_York', false)
    ).toEqual({
      startIso: '2026-07-15T13:00:00.000Z',
      endIso: '2026-07-15T12:00:00.000Z',
    })
  })
})

describe('nextDay', () => {
  it('advances by one calendar day', () => {
    expect(nextDay('2026-07-15')).toBe('2026-07-16')
  })

  it('spans a month boundary', () => {
    expect(nextDay('2026-07-31')).toBe('2026-08-01')
  })

  it('spans a year boundary', () => {
    expect(nextDay('2026-12-31')).toBe('2027-01-01')
  })
})

describe('dateRangeInclusive', () => {
  it('returns a single-element array when start equals end', () => {
    expect(dateRangeInclusive('2026-04-15', '2026-04-15')).toEqual([
      '2026-04-15',
    ])
  })

  it('returns each day inclusive across a multi-day range', () => {
    expect(dateRangeInclusive('2026-04-15', '2026-04-17')).toEqual([
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
    ])
  })

  it('spans a month boundary correctly', () => {
    expect(dateRangeInclusive('2026-04-30', '2026-05-02')).toEqual([
      '2026-04-30',
      '2026-05-01',
      '2026-05-02',
    ])
  })

  it('returns empty array when end is before start', () => {
    expect(dateRangeInclusive('2026-04-17', '2026-04-15')).toEqual([])
  })
})
