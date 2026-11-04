import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PersonHero } from './PersonHero'

describe('PersonHero', () => {
  it('shows the name as the page heading, with current roles in the shared experience', () => {
    render(<PersonHero name="Fatima Ali" roles={['Event Admin', 'Cloud Member']} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fatima Ali')
    expect(screen.queryByText('Sisters')).not.toBeInTheDocument()
    const roles = screen.getByRole('list', { name: 'Current roles' })
    expect(roles).toHaveTextContent('Event Admin')
    expect(roles).toHaveTextContent('Cloud Member')
  })

  it('says so when there are no current roles, without program labels', () => {
    render(<PersonHero name="Yusuf Onboard" roles={[]} />)
    expect(screen.getByText('No current roles')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Brothers')).not.toBeInTheDocument()
    expect(screen.queryByText('Sisters')).not.toBeInTheDocument()
  })
})
