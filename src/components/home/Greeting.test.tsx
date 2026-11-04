import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Greeting } from './Greeting'

describe('Greeting', () => {
  it('renders a personalized salam using only the first name', () => {
    render(<Greeting fullName="Omar Anees" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Salaam,')
    expect(heading).toHaveTextContent('Omar')
  })

  it('falls back to "Member" when fullName is empty', () => {
    render(<Greeting fullName="" />)
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent('Member')
  })

  it('uses only the first space-separated token of a multi-word name', () => {
    render(<Greeting fullName="Mohamed Abdul Rahman" />)
    expect(screen.getByText('Salaam, Mohamed')).toBeInTheDocument()
    expect(screen.queryByText(/Rahman/)).not.toBeInTheDocument()
  })
})
