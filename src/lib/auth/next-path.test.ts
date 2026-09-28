import { describe, it, expect } from 'vitest'
import { loginUrlFor, safeNextPath } from './next-path'

describe('safeNextPath', () => {
  it('keeps a same-site path with its query', () => {
    expect(safeNextPath('/people/?q=zaid')).toBe('/people/?q=zaid')
    expect(safeNextPath('/conferences/abc-123/')).toBe('/conferences/abc-123/')
  })

  it('rejects anything that could leave the site', () => {
    expect(safeNextPath('https://evil.example/')).toBeNull()
    expect(safeNextPath('//evil.example/')).toBeNull()
    expect(safeNextPath('/\\evil.example')).toBeNull()
    expect(safeNextPath('javascript:alert(1)')).toBeNull()
  })

  it('rejects the auth flow itself', () => {
    expect(safeNextPath('/login/')).toBeNull()
    expect(safeNextPath('/auth/callback')).toBeNull()
    expect(safeNextPath('/onboarding?step=1')).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath('')).toBeNull()
  })
})

describe('loginUrlFor', () => {
  const at = (path: string) => new URL(path, 'https://app.youngmuslims.com')

  it('remembers the page a signed-out visitor was headed to', () => {
    const url = loginUrlFor(at('/people/?q=zaid'))
    expect(url.pathname).toBe('/login/')
    expect(url.searchParams.get('next')).toBe('/people/?q=zaid')
  })

  it('drops the original query from the login URL itself', () => {
    expect(loginUrlFor(at('/people/?q=zaid')).searchParams.get('q')).toBeNull()
  })

  it('keeps an error code alongside next', () => {
    const url = loginUrlFor(at('/home/'), 'session_expired')
    expect(url.searchParams.get('error')).toBe('session_expired')
    expect(url.searchParams.get('next')).toBe('/home/')
  })

  it('does not remember API calls or the root', () => {
    expect(loginUrlFor(at('/api/sync/')).searchParams.has('next')).toBe(false)
    expect(loginUrlFor(at('/')).searchParams.has('next')).toBe(false)
  })
})
