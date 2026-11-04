import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.side
  delete document.documentElement.dataset.themeSide
})

describe('shared brand preview', () => {
  it('normalizes old saved program preferences and removes obsolete attributes', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_BRAND_PREVIEW', '1')
    window.localStorage.setItem('ym-brand-preview', 'sisters')
    document.documentElement.dataset.side = 'sisters'
    document.documentElement.dataset.themeSide = 'sisters'
    const { BrandPreviewToggle } = await import('./BrandPreviewToggle')
    render(<BrandPreviewToggle />)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'ym'))
    expect(document.documentElement).not.toHaveAttribute('data-side')
    expect(document.documentElement).not.toHaveAttribute('data-theme-side')
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Shared brand' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: /brothers|sisters/i })).not.toBeInTheDocument()
  })

  it('normalizes an old program URL to the shared preview', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_BRAND_PREVIEW', '1')
    window.history.replaceState({}, '', '/?brand=brothers')
    const { BrandPreviewToggle } = await import('./BrandPreviewToggle')
    render(<BrandPreviewToggle />)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme', 'ym'))
    expect(document.documentElement).not.toHaveAttribute('data-side')
  })

  it('does not render or change the theme when the preview flag is off', async () => {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_BRAND_PREVIEW', '0')
    const { BrandPreviewToggle } = await import('./BrandPreviewToggle')
    render(<BrandPreviewToggle />)
    expect(screen.queryByRole('group', { name: 'Brand preview' })).not.toBeInTheDocument()
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })
})
