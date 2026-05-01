import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Greeting } from './Greeting'

describe('Greeting', () => {
  it('renders the salam line and the first name with a period', () => {
    render(<Greeting fullName="Omar Anees" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Assalamu alaykum,')
    expect(heading).toHaveTextContent('Omar.')
  })

  it('puts the name on its own visual line via <br>', () => {
    const { container } = render(<Greeting fullName="Omar Anees" />)
    expect(container.querySelector('br')).toBeInTheDocument()
  })

  it('renders the name in the primary accent color', () => {
    render(<Greeting fullName="Omar Anees" />)
    const nameSpan = screen.getByText('Omar.')
    expect(nameSpan).toHaveClass('text-primary')
  })

  it('falls back to "Member" when fullName is empty', () => {
    render(<Greeting fullName="" />)
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent('Member.')
  })

  it('uses only the first space-separated token of a multi-word name', () => {
    render(<Greeting fullName="Mohamed Abdul Rahman" />)
    expect(screen.getByText('Mohamed.')).toBeInTheDocument()
    expect(screen.queryByText(/Rahman/)).not.toBeInTheDocument()
  })
})
