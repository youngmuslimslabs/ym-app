import { describe, it, expect } from 'vitest'
import { getFirstName } from './getFirstName'

describe('getFirstName', () => {
  it('returns the first space-separated token', () => {
    expect(getFirstName('Omar Anees')).toBe('Omar')
  })

  it('handles single-word names', () => {
    expect(getFirstName('Madonna')).toBe('Madonna')
  })

  it('trims surrounding whitespace', () => {
    expect(getFirstName('  Omar Anees  ')).toBe('Omar')
  })

  it('returns the fallback when input is empty', () => {
    expect(getFirstName('', 'Member')).toBe('Member')
  })

  it('returns the fallback when input is whitespace only', () => {
    expect(getFirstName('   ', 'Member')).toBe('Member')
  })

  it('defaults the fallback to "Member" when not provided', () => {
    expect(getFirstName('')).toBe('Member')
  })
})
