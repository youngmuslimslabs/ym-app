// @vitest-environment node
// Pure constants — no DOM needed.
import { describe, it, expect } from 'vitest'
import { TIMEZONE_OPTIONS } from './timezones'

describe('TIMEZONE_OPTIONS', () => {
  it('exposes the five US timezones the SessionEditor offers', () => {
    expect(TIMEZONE_OPTIONS.map((o) => o.value)).toEqual([
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Phoenix',
      'America/Los_Angeles',
    ])
  })

  it('every option has a non-empty label', () => {
    for (const o of TIMEZONE_OPTIONS) {
      expect(o.label.length).toBeGreaterThan(0)
    }
  })
})
