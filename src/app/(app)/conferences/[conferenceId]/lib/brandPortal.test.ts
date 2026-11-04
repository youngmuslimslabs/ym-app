import { describe, expect, it } from 'vitest'
import { BRAND_PORTAL_CLASS, brandPortalProps } from './brandPortal'

describe('shared brand portals', () => {
  it('reapplies only the shared brand scope', () => {
    expect(brandPortalProps()).toEqual({ 'data-theme': 'ym' })
    expect(brandPortalProps()).not.toHaveProperty('data-theme-side')
  })
  it('carries the shared typography classes', () => {
    expect(BRAND_PORTAL_CLASS).toContain('font-sans')
    expect(BRAND_PORTAL_CLASS).toContain('tracking-brand')
  })
})
