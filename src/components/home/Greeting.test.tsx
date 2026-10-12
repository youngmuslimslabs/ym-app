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

  it('sets the salam as an eyebrow and the name as the display headline', () => {
    render(<Greeting fullName="Omar Anees" />)
    expect(screen.getByText('Assalamu alaykum,')).toHaveClass('ym-eyebrow')
    expect(screen.getByText('Omar.')).toHaveClass('ym-display')
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
