import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrandScope } from './brand-scope'
import { Logo } from './logo'

afterEach(() => { delete document.documentElement.dataset.themeSide })
describe('shared brand', () => {
  it('uses the shared scope and unified logo even with a stale program attribute', () => {
    document.documentElement.dataset.themeSide = 'sisters'
    const { container } = render(<BrandScope><Logo variant="full" /></BrandScope>)
    expect(container.firstChild).toHaveAttribute('data-theme', 'ym')
    expect(container.firstChild).not.toHaveAttribute('data-theme-side')
    const mark = screen.getByRole('img', { name: 'Young Muslims' }).firstElementChild as HTMLElement
    expect(mark.style.maskImage).toContain('/brand/general/full.svg')
    expect(container.querySelector('[data-theme-side]')).not.toBeInTheDocument()
  })
})
