import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ResponsiveSelect } from './responsive-select'

// Control the mobile branch deterministically instead of stubbing matchMedia.
const mockUseIsMobile = vi.fn()
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const OPTIONS = [
  { value: 'amir', label: 'Amir' },
  { value: 'naib', label: 'Naib Amir' },
  { value: 'member', label: 'Member' },
]

describe('ResponsiveSelect — mobile centered modal', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(true))

  it('opens options in a dismissible modal on mobile', async () => {
    const user = userEvent.setup()
    render(
      <ResponsiveSelect
        options={OPTIONS}
        onValueChange={vi.fn()}
        placeholder="Select your current role"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    expect(screen.getByText('Naib Amir')).toBeInTheDocument()
  })

  it('selecting an option fires onValueChange and closes the modal', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ResponsiveSelect
        options={OPTIONS}
        onValueChange={onValueChange}
        placeholder="Select your current role"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Naib Amir'))
    expect(onValueChange).toHaveBeenCalledWith('naib')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the selected option label in the trigger', () => {
    render(
      <ResponsiveSelect
        options={OPTIONS}
        value="member"
        onValueChange={vi.fn()}
        placeholder="Select your current role"
      />,
    )
    expect(screen.getByRole('combobox')).toHaveTextContent('Member')
  })
})

describe('ResponsiveSelect — desktop', () => {
  beforeEach(() => mockUseIsMobile.mockReturnValue(false))

  it('opens the native Radix listbox (no Close button) on desktop', async () => {
    const user = userEvent.setup()
    render(
      <ResponsiveSelect
        options={OPTIONS}
        onValueChange={vi.fn()}
        placeholder="Select your current role"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('fires onValueChange when a desktop option is chosen', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ResponsiveSelect
        options={OPTIONS}
        onValueChange={onValueChange}
        placeholder="Select your current role"
      />,
    )
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Amir' }))
    expect(onValueChange).toHaveBeenCalledWith('amir')
  })
})
