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

  it('renders both the lucide icon and a chevron (the chevron is hidden by default and revealed on hover)', () => {
    const { container } = render(
      <QuickActionRow
        href="/docs"
        icon={Users}
        title="Docs"
        description="Halaqa & SOPs"
      />,
    )
    // Two SVGs: provided icon + ChevronRight
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
    // The second SVG (chevron) starts at opacity-0
    expect(svgs[1]).toHaveClass('opacity-0')
  })
})
