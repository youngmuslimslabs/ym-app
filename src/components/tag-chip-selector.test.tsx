import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TagChipSelector } from './tag-chip-selector'

const OPTIONS = [
  { value: 'led-a-team', label: 'Led a team' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'fundraising', label: 'Fundraising' },
]

describe('TagChipSelector', () => {
  it('renders a chip for each option', () => {
    render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Led a team' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logistics' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fundraising' })).toBeInTheDocument()
  })

  it('marks selected options as pressed and others as not', () => {
    render(<TagChipSelector options={OPTIONS} selected={['logistics']} onToggle={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Logistics' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Led a team' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onToggle with the option value when an unselected chip is clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: 'Fundraising' }))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('fundraising')
  })

  it('calls onToggle with the value when an already-selected chip is clicked (to deselect)', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<TagChipSelector options={OPTIONS} selected={['logistics']} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: 'Logistics' }))
    expect(onToggle).toHaveBeenCalledWith('logistics')
  })

  describe('custom tags (allowCustom)', () => {
    it('does not show an "add your own" affordance by default', () => {
      render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={vi.fn()} />)
      expect(screen.queryByRole('button', { name: /add your own/i })).not.toBeInTheDocument()
    })

    it('shows an "add your own" affordance when allowCustom is set', () => {
      render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={vi.fn()} allowCustom />)
      expect(screen.getByRole('button', { name: /add your own/i })).toBeInTheDocument()
    })

    it('reveals a text input when "add your own" is clicked', async () => {
      const user = userEvent.setup()
      render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={vi.fn()} allowCustom />)
      await user.click(screen.getByRole('button', { name: /add your own/i }))
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('commits a trimmed custom value via onToggle on Enter', async () => {
      const onToggle = vi.fn()
      const user = userEvent.setup()
      render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={onToggle} allowCustom />)
      await user.click(screen.getByRole('button', { name: /add your own/i }))
      await user.type(screen.getByRole('textbox'), '  Ran a booth  {Enter}')
      expect(onToggle).toHaveBeenCalledWith('Ran a booth')
    })

    it('does not commit an empty or whitespace-only custom value', async () => {
      const onToggle = vi.fn()
      const user = userEvent.setup()
      render(<TagChipSelector options={OPTIONS} selected={[]} onToggle={onToggle} allowCustom />)
      await user.click(screen.getByRole('button', { name: /add your own/i }))
      await user.type(screen.getByRole('textbox'), '   {Enter}')
      expect(onToggle).not.toHaveBeenCalled()
    })

    it('renders a selected value not present in options as a custom chip', () => {
      render(
        <TagChipSelector options={OPTIONS} selected={['Ran a booth']} onToggle={vi.fn()} allowCustom />,
      )
      expect(screen.getByRole('button', { name: 'Ran a booth' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  })
})
