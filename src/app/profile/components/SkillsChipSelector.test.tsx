import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ProfileModeProvider } from '@/contexts/ProfileModeContext'

import { SkillsChipSelector } from './SkillsChipSelector'

function renderEditable(ui: React.ReactElement) {
  return render(<ProfileModeProvider isEditable={true}>{ui}</ProfileModeProvider>)
}
function renderReadOnly(ui: React.ReactElement) {
  return render(<ProfileModeProvider isEditable={false}>{ui}</ProfileModeProvider>)
}

describe('SkillsChipSelector', () => {
  describe('edit mode', () => {
    it('renders a toggle for each skill', () => {
      renderEditable(<SkillsChipSelector selectedSkills={[]} onToggle={vi.fn()} />)
      expect(screen.getByRole('button', { name: 'Leadership' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Fundraising' })).toBeInTheDocument()
    })

    it('calls onToggle with the skill id when a chip is clicked', async () => {
      const onToggle = vi.fn()
      const user = userEvent.setup()
      renderEditable(<SkillsChipSelector selectedSkills={[]} onToggle={onToggle} />)
      await user.click(screen.getByRole('button', { name: 'Leadership' }))
      expect(onToggle).toHaveBeenCalledWith('leadership')
    })

    it('marks a selected skill as pressed', () => {
      renderEditable(
        <SkillsChipSelector selectedSkills={['leadership']} onToggle={vi.fn()} />,
      )
      expect(screen.getByRole('button', { name: 'Leadership' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('shows the selected count', () => {
      renderEditable(
        <SkillsChipSelector selectedSkills={['leadership', 'writing']} onToggle={vi.fn()} />,
      )
      expect(screen.getByText('2 selected')).toBeInTheDocument()
    })
  })

  describe('read-only mode', () => {
    it('shows an empty state when no skills selected', () => {
      renderReadOnly(<SkillsChipSelector selectedSkills={[]} onToggle={vi.fn()} />)
      expect(screen.getByText('No skills added yet')).toBeInTheDocument()
    })

    it('renders selected skills non-interactively when present', () => {
      renderReadOnly(
        <SkillsChipSelector selectedSkills={['leadership']} onToggle={vi.fn()} />,
      )
      expect(screen.getByText('Leadership')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Leadership' })).not.toBeInTheDocument()
    })
  })
})
