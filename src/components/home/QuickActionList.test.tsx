import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Users, DollarSign, FileText } from 'lucide-react'

import { QuickActionList } from './QuickActionList'

describe('QuickActionList', () => {
  it('renders one row per action', () => {
    render(
      <QuickActionList
        actions={[
          { href: '/people', icon: Users, title: 'People', description: 'Browse YM members' },
          { href: '/finance', icon: DollarSign, title: 'Finance', description: 'Reimbursements' },
          { href: '/docs', icon: FileText, title: 'Docs', description: 'Halaqa & SOPs' },
        ]}
      />,
    )
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('passes hrefs and titles to each row', () => {
    render(
      <QuickActionList
        actions={[
          { href: '/people', icon: Users, title: 'People', description: 'Browse' },
          { href: '/docs', icon: FileText, title: 'Docs', description: 'SOPs' },
        ]}
      />,
    )
    expect(screen.getByRole('link', { name: /People/ })).toHaveAttribute('href', '/people')
    expect(screen.getByRole('link', { name: /Docs/ })).toHaveAttribute('href', '/docs')
  })

  it('renders nothing when actions is empty', () => {
    const { container } = render(<QuickActionList actions={[]} />)
    expect(container.querySelectorAll('a').length).toBe(0)
  })
})
