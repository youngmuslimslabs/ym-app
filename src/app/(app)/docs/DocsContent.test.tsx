import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { DocsContent } from './DocsContent'

const resources = [{ title: 'A long reference document title that must remain readable on a phone', url: 'https://example.com/resource' }]
const categories = [
  { name: 'NNET Situations', docs: [{ title: 'Dealing with Minors', url: 'https://example.com/minors' }] },
  { name: 'Tarbiyah / SC', docs: [{ title: 'SC Lead Onboarding', url: 'https://example.com/sc' }] },
]

describe('approved Docs feature', () => {
  it('preserves real destination URLs and safe external-link behavior', () => {
    render(<DocsContent resources={resources} categories={categories} />)
    const link = screen.getByRole('link', { name: /A long reference document title/ })
    expect(link).toHaveAttribute('href', resources[0].url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /Dealing with Minors/ })).toHaveAttribute('href', 'https://example.com/minors')
  })

  it('supports keyboard expansion and retains the existing multiple-open behavior', async () => {
    const user = userEvent.setup()
    render(<DocsContent resources={resources} categories={categories} />)
    const second = screen.getByRole('button', { name: /Tarbiyah/ })
    second.focus()
    await user.keyboard('{Enter}')
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: /SC Lead Onboarding/ })).toBeVisible()
    expect(screen.getByRole('link', { name: /Dealing with Minors/ })).toBeVisible()
    await user.keyboard('{Enter}')
    expect(second).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: /SC Lead Onboarding/ })).not.toBeInTheDocument()
  })
})
