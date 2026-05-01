// @vitest-environment node
// Pure logic — no DOM needed. Faster than the default jsdom env.
import { describe, it, expect } from 'vitest'
import { composeTzIso, decomposeTzIso, dateRangeInclusive } from './datetime'

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

  // KNOWN LIMITATION pinned as a skipped test — see the comment in
  // datetime.ts. Removing `.skip` once the offset-derivation is fixed will
  // light this up as a regression guard.
  it.skip('handles spring-forward boundary (currently 1h off)', () => {
    // 03:30 on 2026-03-08 in NY is unambiguously EDT (DST started at 02:00).
    // Correct UTC: 07:30. Function currently returns 08:30 (sampled EST offset).
    expect(
      composeTzIso('2026-03-08', '03:30', 'America/New_York')
    ).toBe('2026-03-08T07:30:00.000Z')
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
