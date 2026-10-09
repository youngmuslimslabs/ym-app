/**
 * Validation utilities for form inputs
 */

/**
 * Digits of a US phone number, without a leading +1 country code. Browser
 * autofill and pasted numbers often arrive as "+1 (555) 123-4567"; keeping the
 * 1 shifted every digit and cut off the last one. US area codes never start
 * with 1, so a leading 1 on an 11+ digit number is always the country code.
 */
function nationalDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.length > 10 && digits.startsWith('1') ? digits.slice(1) : digits
}

/**
 * Format phone number as user types: (555) 123-4567
 * Strips non-digits and a +1 country code, limits to 10 digits, formats progressively
 */
export function formatPhoneNumber(value: string): string {
  const digits = nationalDigits(value)

  // Limit to 10 digits
  const limited = digits.slice(0, 10)

  // Format based on length
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Check if phone has exactly 10 digits (US format)
 */
export function isValidPhone(phone: string): boolean {
  return nationalDigits(phone).length === 10
}

/**
 * Basic email validation: has @ and domain with TLD
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return pattern.test(email)
}
