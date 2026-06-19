// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { normalizeEmail } from './email'

describe('normalizeEmail', () => {
  it('lowercases the address so casing differences cannot fork a user', () => {
    expect(normalizeEmail('John.Doe@YoungMuslims.com')).toBe('john.doe@youngmuslims.com')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeEmail('  john@youngmuslims.com  ')).toBe('john@youngmuslims.com')
  })

  it('trims and lowercases together', () => {
    expect(normalizeEmail('  John@YoungMuslims.COM ')).toBe('john@youngmuslims.com')
  })

  it('leaves an already-normalized address unchanged', () => {
    expect(normalizeEmail('john@youngmuslims.com')).toBe('john@youngmuslims.com')
  })
})
