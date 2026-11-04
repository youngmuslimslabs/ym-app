import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'

import { QuickActionRow } from './QuickActionRow'

describe('QuickActionRow', () => {
  it('renders title, description, and links to href', () => {
    render(
      <QuickActionRow
        href="/people"
        icon={Users}
        title="People"
        description="Browse YM members"
      />,
    )

    const link = screen.getByRole('link', { name: /People/ })
    expect(link).toHaveAttribute('href', '/people')
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Browse YM members')).toBeInTheDocument()
  })

  it('applies the group class so child hover transitions can be orchestrated', () => {
    render(
      <QuickActionRow
        href="/finance"
        icon={Users}
        title="Finance"
        description="Reimbursements"
      />,
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('group')
  })

  it('renders the lucide icon and an arrow, both hidden from assistive tech', () => {
    const { container } = render(
      <QuickActionRow
        href="/docs"
        icon={Users}
        title="Docs"
        description="Halaqa & SOPs"
      />,
    )
    // Two SVGs: provided icon + ArrowRight. The link's name is its text.
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
    svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'))
  })
})
