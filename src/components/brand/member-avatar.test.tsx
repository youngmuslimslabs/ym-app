import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { MemberAvatar, getInitials } from './member-avatar'

describe('getInitials', () => {
  it('takes the first and last word', () => {
    expect(getInitials('Mohamed Abdul Rahman')).toBe('MR')
  })

  it('uses one letter for a single name', () => {
    expect(getInitials('omar')).toBe('O')
  })

  it('falls back to ? for an empty name', () => {
    expect(getInitials('   ')).toBe('?')
  })
})

describe('MemberAvatar', () => {
  it('is one image named after the member', () => {
    render(<MemberAvatar name="Fatima Ali" />)
    expect(screen.getByRole('img', { name: 'Fatima Ali' })).toHaveTextContent('FA')
  })

  it('uses the fixed side colour when a side is given', () => {
    render(<MemberAvatar name="Fatima Ali" side="sisters" />)
    expect(screen.getByRole('img', { name: 'Fatima Ali' })).toHaveClass('bg-brand-jade')
  })

  it('follows the theme when no side is given', () => {
    render(<MemberAvatar name="Fatima Ali" />)
    expect(screen.getByRole('img', { name: 'Fatima Ali' })).toHaveClass('bg-primary')
  })

  it('stays out of the accessibility tree when decorative', () => {
    const { container } = render(<MemberAvatar name="Fatima Ali" decorative />)
    expect(screen.queryByRole('img', { name: 'Fatima Ali' })).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('drops a photo that fails to load, leaving the initials', () => {
    const { container } = render(
      <MemberAvatar name="Fatima Ali" src="https://example.com/expired.jpg" />,
    )
    const photo = container.querySelector('img')
    expect(photo).toBeInTheDocument()
    fireEvent.error(photo!)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fatima Ali' })).toHaveTextContent('FA')
  })
})
