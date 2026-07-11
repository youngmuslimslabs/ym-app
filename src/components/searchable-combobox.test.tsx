import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SearchableCombobox } from './searchable-combobox'

// Control the mobile branch deterministically instead of stubbing matchMedia.
const mockUseIsMobile = vi.fn()
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
]

describe('SearchableCombobox — mobile bottom sheet', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('opens the options in a dismissible modal sheet on mobile', async () => {
    const user = userEvent.setup()
    render(
      <SearchableCombobox options={OPTIONS} onChange={vi.fn()} placeholder="Pick fruit" />,
    )
    await user.click(screen.getByRole('combobox'))
    // The mobile bottom sheet is a modal: it renders a Close affordance and the
    // options. The desktop Popover is a non-modal anchored overlay with no Close
    // button (asserted below). A modal that isn't trigger-anchored can't clip
    // off-screen — that's the fix.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('selecting an option in the sheet fires onChange and closes it', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <SearchableCombobox options={OPTIONS} onChange={onChange} placeholder="Pick fruit" />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Banana'))
    expect(onChange).toHaveBeenCalledWith({ type: 'existing', value: 'b', label: 'Banana' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the desktop popover non-modal (no Close button) when not mobile', async () => {
    mockUseIsMobile.mockReturnValue(false)
    const user = userEvent.setup()
    render(
      <SearchableCombobox options={OPTIONS} onChange={vi.fn()} placeholder="Pick fruit" />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })
})
