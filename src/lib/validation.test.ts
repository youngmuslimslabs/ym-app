import { describe, it, expect } from 'vitest'
import { formatPhoneNumber, isValidPhone, isValidEmail } from './validation'

describe('formatPhoneNumber', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhoneNumber('')).toBe('')
  })

  it('returns empty string for non-digit input', () => {
    expect(formatPhoneNumber('abc')).toBe('')
  })

  it('formats 1-3 digits with opening parenthesis', () => {
    expect(formatPhoneNumber('5')).toBe('(5')
    expect(formatPhoneNumber('55')).toBe('(55')
    expect(formatPhoneNumber('555')).toBe('(555')
  })

  it('formats 4-6 digits with area code and space', () => {
    expect(formatPhoneNumber('5551')).toBe('(555) 1')
    expect(formatPhoneNumber('55512')).toBe('(555) 12')
    expect(formatPhoneNumber('555123')).toBe('(555) 123')
  })

  it('formats 7-10 digits with full format', () => {
    expect(formatPhoneNumber('5551234')).toBe('(555) 123-4')
    expect(formatPhoneNumber('55512345')).toBe('(555) 123-45')
    expect(formatPhoneNumber('555123456')).toBe('(555) 123-456')
    expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567')
  })

  it('strips non-digit characters from input', () => {
    expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567')
    expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567')
    expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567')
  })

  it('limits to 10 digits', () => {
    expect(formatPhoneNumber('55512345678901')).toBe('(555) 123-4567')
  })

  it('drops a +1 country code from autofilled or pasted numbers', () => {
    expect(formatPhoneNumber('+1 (555) 123-4567')).toBe('(555) 123-4567')
    expect(formatPhoneNumber('+15551234567')).toBe('(555) 123-4567')
    expect(formatPhoneNumber('1-555-123-4567')).toBe('(555) 123-4567')
  })

  it('keeps a leading 1 while the number is still being typed', () => {
    expect(formatPhoneNumber('1')).toBe('(1')
    expect(formatPhoneNumber('1555123456')).toBe('(155) 512-3456')
  })

  it('handles mixed input with letters and numbers', () => {
    expect(formatPhoneNumber('5a5b5c1d2e3f4g5h6i7')).toBe('(555) 123-4567')
  })
})

describe('isValidPhone', () => {
  it('returns true for valid 10-digit phone', () => {
    expect(isValidPhone('5551234567')).toBe(true)
  })

  it('returns true for formatted phone with 10 digits', () => {
    expect(isValidPhone('(555) 123-4567')).toBe(true)
    expect(isValidPhone('555-123-4567')).toBe(true)
    expect(isValidPhone('555.123.4567')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isValidPhone('')).toBe(false)
  })

  it('returns false for less than 10 digits', () => {
    expect(isValidPhone('555123456')).toBe(false)
    expect(isValidPhone('(555) 123-456')).toBe(false)
  })

  it('returns false for more than 10 digits', () => {
    expect(isValidPhone('55512345678')).toBe(false)
  })

  it('accepts a number with a +1 country code', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true)
  })

  it('returns false for non-digit input', () => {
    expect(isValidPhone('abcdefghij')).toBe(false)
  })

  it('handles partial formatting', () => {
    expect(isValidPhone('(555')).toBe(false)
    expect(isValidPhone('(555) 123')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('returns true for valid email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name@example.com')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
    expect(isValidEmail('user@subdomain.example.com')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('returns false for missing @ symbol', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('returns false for missing domain', () => {
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user@.com')).toBe(false)
  })

  it('returns false for missing TLD', () => {
    expect(isValidEmail('user@example')).toBe(false)
    expect(isValidEmail('user@example.')).toBe(false)
  })

  it('returns false for spaces in email', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
    expect(isValidEmail('user@ example.com')).toBe(false)
    expect(isValidEmail('user@example .com')).toBe(false)
  })

  it('returns false for multiple @ symbols', () => {
    expect(isValidEmail('user@@example.com')).toBe(false)
    expect(isValidEmail('user@test@example.com')).toBe(false)
  })

  it('handles edge cases', () => {
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@.com')).toBe(false)
    expect(isValidEmail('a@b.c')).toBe(true) // Minimal valid email
  })
})
