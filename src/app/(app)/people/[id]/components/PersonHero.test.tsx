import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PersonHero } from './PersonHero'

describe('PersonHero', () => {
  it('shows the name as the page heading, with the side and current roles', () => {
    render(<PersonHero name="Fatima Ali" side="sisters" roles={['Event Admin', 'Cloud Member']} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fatima Ali')
    expect(screen.getByText('Sisters')).toBeInTheDocument()
    const roles = screen.getByRole('list', { name: 'Current roles' })
    expect(roles).toHaveTextContent('Event Admin')
    expect(roles).toHaveTextContent('Cloud Member')
  })

  it('says so when there are no current roles, and omits the side when unknown', () => {
    render(<PersonHero name="Yusuf Onboard" roles={[]} />)
    expect(screen.getByText('No current roles')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('Brothers')).not.toBeInTheDocument()
    expect(screen.queryByText('Sisters')).not.toBeInTheDocument()
  })
})
