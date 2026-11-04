import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { OnboardingFlow } from './OnboardingFlow'

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ onChange }: { onChange: (date: Date) => void }) => <button onClick={() => onChange(new Date(2000, 0, 1))}>Choose date</button>,
}))
vi.mock('@/components/responsive-select', () => ({
  ResponsiveSelect: ({ options, value, onValueChange, placeholder }: { options: { value: string; label: string }[]; value?: string; onValueChange: (value: string) => void; placeholder: string }) => <select aria-label={placeholder} value={value ?? ''} onChange={event => onValueChange(event.target.value)}><option value="">Choose</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>,
}))

async function reachGeography() {
  const user = userEvent.setup()
  await user.type(screen.getByRole('textbox'), '5551112222{Enter}')
  await user.type(screen.getByRole('textbox'), 'me@example.com{Enter}')
  await user.click(screen.getByRole('combobox'))
  await user.click(await screen.findByRole('option', { name: 'American' }))
  await user.click(screen.getByRole('button', { name: 'Choose date' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  return user
}

describe('reviewed onboarding geography', () => {
  it('searches, selects without advancing, preserves Back, and clears incompatible NeighborNet', async () => {
    render(<OnboardingFlow />)
    const user = await reachGeography()
    expect(screen.getByText('Step 5 of 8')).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox'), 'Hous')
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    await user.click(screen.getByRole('radio', { name: 'Houston' }))
    expect(screen.getByText('Step 5 of 8')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Katy' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('radio', { name: 'Houston' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Dallas' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByRole('radio', { name: 'Katy' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await user.type(screen.getByRole('searchbox'), 'no match')
    expect(screen.getByRole('status')).toHaveTextContent('No matches found')
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('radio', { name: 'Plano' })).toBeInTheDocument()
  })

  it('retains all answers after a failed save and retries the same payload', async () => {
    const save = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    render(<OnboardingFlow onComplete={save} />)
    const user = await reachGeography()
    await user.click(screen.getByRole('radio', { name: 'Houston' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('radio', { name: 'Katy' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.selectOptions(screen.getByRole('combobox'), 'Core Team Member')
    await user.click(screen.getByRole('button', { name: 'Enter the app' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Your answers are still here')
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0])
    expect(save.mock.calls[0][0]).toMatchObject({ subregion: 'Houston', neighbornet: 'Katy', ethnicity: 'American' })
  })
})
