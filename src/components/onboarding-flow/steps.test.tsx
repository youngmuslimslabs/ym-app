import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TextStep, ChoiceStep, DateStep } from './steps'

describe('TextStep (Typeform: type then Enter)', () => {
  it('renders the label and a text input', () => {
    render(<TextStep label="What's your phone number?" value="" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('disables Continue when empty, enables when filled', () => {
    const { rerender } = render(
      <TextStep label="Phone" value="" onChange={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(<TextStep label="Phone" value="555" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('advances on Enter when the value is non-empty', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<TextStep label="Phone" value="555" onChange={vi.fn()} onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('does not advance on Enter when empty', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<TextStep label="Phone" value="" onChange={vi.fn()} onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onNext).not.toHaveBeenCalled()
  })

  it('does NOT auto-advance on keystroke (only onChange fires)', async () => {
    const onNext = vi.fn()
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TextStep label="Phone" value="" onChange={onChange} onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), '5')
    expect(onChange).toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
  })

  it('shows a "press Enter" hint', () => {
    render(<TextStep label="Phone" value="" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText(/press enter/i)).toBeInTheDocument()
  })
})

describe('ChoiceStep (Typeform: tap = advance)', () => {
  const OPTIONS = [
    { value: 'arab', label: 'Arab' },
    { value: 'other', label: 'Other' },
  ]

  it('renders a button per option', () => {
    render(<ChoiceStep label="How do you identify?" options={OPTIONS} onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Arab' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Other' })).toBeInTheDocument()
  })

  it('calls onSelect with the value when an option is tapped', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ChoiceStep label="How do you identify?" options={OPTIONS} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Other' }))
    expect(onSelect).toHaveBeenCalledWith('other')
  })
})

describe('DateStep (native date, advance on change)', () => {
  it('renders a native date input and advances when a date is picked', () => {
    const onChange = vi.fn()
    const onNext = vi.fn()
    render(<DateStep label="Your date of birth" value="" onChange={onChange} onNext={onNext} />)
    const input = screen.getByLabelText('Your date of birth')
    expect(input).toHaveAttribute('type', 'date')
    fireEvent.change(input, { target: { value: '2000-01-15' } })
    expect(onChange).toHaveBeenCalledWith('2000-01-15')
    expect(onNext).toHaveBeenCalledOnce()
  })
})
