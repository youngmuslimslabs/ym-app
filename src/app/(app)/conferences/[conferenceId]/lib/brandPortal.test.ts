import { describe, expect, it } from 'vitest'
import { BRAND_PORTAL_CLASS, brandPortalProps } from './brandPortal'

describe('brandPortalProps', () => {
  it('re-applies the brand scope and the side to portalled content', () => {
    expect(brandPortalProps('sisters')).toEqual({ 'data-theme': 'ym', 'data-theme-side': 'sisters' })
  })

  it('leaves the side off for General (null or undefined)', () => {
    expect(brandPortalProps(null)['data-theme-side']).toBeUndefined()
    expect(brandPortalProps(undefined)['data-theme']).toBe('ym')
  })

  it('carries the same type classes BrandScope sets', () => {
    expect(BRAND_PORTAL_CLASS).toContain('font-sans')
    expect(BRAND_PORTAL_CLASS).toContain('tracking-brand')
  })
})
