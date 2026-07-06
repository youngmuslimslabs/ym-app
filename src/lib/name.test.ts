// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { normalizeName } from './name'

describe('normalizeName', () => {
  it('title-cases an all-uppercase name', () => {
    expect(normalizeName('ABDUL AZIZ')).toBe('Abdul Aziz')
  })

  it('title-cases an all-lowercase name', () => {
    expect(normalizeName('mary jane')).toBe('Mary Jane')
  })

  it('title-cases across hyphens and apostrophes', () => {
    expect(normalizeName('jo-ann')).toBe('Jo-Ann')
    expect(normalizeName("O'BRIEN")).toBe("O'Brien")
  })

  it('preserves intentional mixed case rather than flattening it', () => {
    expect(normalizeName('McDonald')).toBe('McDonald')
    expect(normalizeName('DeShawn')).toBe('DeShawn')
  })

  it('leaves an already-correct simple name unchanged', () => {
    expect(normalizeName('John')).toBe('John')
  })

  it('passes null through', () => {
    expect(normalizeName(null)).toBeNull()
  })

  it('is idempotent — re-normalizing a fixed name changes nothing', () => {
    expect(normalizeName(normalizeName('MARY JANE'))).toBe('Mary Jane')
  })
})
