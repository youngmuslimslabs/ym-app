import { describe, it, expect } from 'vitest'

import { CHECK_IN_CODE_MAX_LENGTH, formatCheckInCode } from './check-in-code'

describe('formatCheckInCode (#73)', () => {
  it('shows codes in capitals so case never looks like it matters', () => {
    expect(formatCheckInCode('ab12')).toBe('AB12')
  })

  it('caps the length at what an admin can set', () => {
    expect(formatCheckInCode('x'.repeat(40))).toHaveLength(CHECK_IN_CODE_MAX_LENGTH)
  })
})
