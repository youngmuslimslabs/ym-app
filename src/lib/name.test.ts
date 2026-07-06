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

  it('title-cases accented all-caps correctly', () => {
    expect(normalizeName('JOSÉ')).toBe('José')
    expect(normalizeName('MÜLLER')).toBe('Müller')
  })

  it('preserves intentional mixed case rather than flattening it', () => {
    expect(normalizeName('McDonald')).toBe('McDonald')
    expect(normalizeName('DeShawn')).toBe('DeShawn')
  })

  it('leaves an already-correct simple name unchanged', () => {
    expect(normalizeName('John')).toBe('John')
  })

  it('leaves caseless input (digits/symbols) unchanged', () => {
    expect(normalizeName('123')).toBe('123')
  })

  // Deliberate limitation: case is judged over the whole string, so a
  // partial-caps multi-word name is treated as mixed and left as-is. This
  // guards against title-casing lowercase particles like "bin"/"van".
  it('leaves partial-caps multi-word names untouched (documented limitation)', () => {
    expect(normalizeName('Abdul RAHMAN')).toBe('Abdul RAHMAN')
    expect(normalizeName('bin Salman')).toBe('bin Salman')
    expect(normalizeName('van der Berg')).toBe('van der Berg')
  })

  it('maps null and blank input to null', () => {
    expect(normalizeName(null)).toBeNull()
    expect(normalizeName('')).toBeNull()
    expect(normalizeName('   ')).toBeNull()
  })

  it('is idempotent — re-normalizing a fixed name changes nothing', () => {
    expect(normalizeName(normalizeName('MARY JANE'))).toBe('Mary Jane')
  })
})
