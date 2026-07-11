import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DatePicker } from './date-picker'

// Control the mobile branch deterministically instead of stubbing matchMedia.
const mockUseIsMobile = vi.fn()
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

describe('DatePicker — mobile centered modal', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('opens the calendar in a dismissible modal on mobile', async () => {
    const user = userEvent.setup()
    render(<DatePicker value={undefined} onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /pick a date/i }))
    // Centered Dialog is modal: it renders a Close affordance and a calendar grid.
    // The desktop Popover renders neither a Close button nor modal chrome.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('picking a day fires onChange and closes the modal', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker value={undefined} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /pick a date/i }))
    // Day cells are buttons whose accessible name is the full date (e.g.
    // "July 10th, 2026"); click the 10th of whichever month the calendar shows.
    const grid = screen.getByRole('grid')
    await user.click(within(grid).getByRole('button', { name: /\b10th\b/i }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the desktop popover non-modal (no Close button) when not mobile', async () => {
    mockUseIsMobile.mockReturnValue(false)
    const user = userEvent.setup()
    render(<DatePicker value={undefined} onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /pick a date/i }))
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })
})
