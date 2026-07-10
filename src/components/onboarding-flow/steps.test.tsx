import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TextStep, SelectStep, ComboboxStep, DateStep } from './steps'
import { formatPhoneNumber, isValidPhone, isValidEmail } from '@/lib/validation'

describe('TextStep (Typeform: type then Enter)', () => {
  it('renders the label and a text input', () => {
    render(<TextStep label="What's your phone number?" value="" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText("What's your phone number?")).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('without a validator, gates Continue on non-empty (default behavior)', () => {
    const { rerender } = render(
      <TextStep label="Name" value="" onChange={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(<TextStep label="Name" value="Sam" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('with a validator, gates Continue on VALID (not just non-empty)', () => {
    const { rerender } = render(
      <TextStep label="Phone" type="tel" validate={isValidPhone} value="555" onChange={vi.fn()} onNext={vi.fn()} />,
    )
    // non-empty but invalid → still disabled
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(
      <TextStep label="Phone" type="tel" validate={isValidPhone} value="(555) 123-4567" onChange={vi.fn()} onNext={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /continue/i })).toBeEnabled()
  })

  it('applies the formatter to typed input (phone → dashes, digit cap)', () => {
    const onChange = vi.fn()
    render(<TextStep label="Phone" type="tel" format={formatPhoneNumber} value="" onChange={onChange} onNext={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '55512345678999' } })
    expect(onChange).toHaveBeenCalledWith('(555) 123-4567')
  })

  it('does not advance on Enter when the value is invalid', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<TextStep label="Phone" type="tel" validate={isValidPhone} value="555" onChange={vi.fn()} onNext={onNext} />)
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onNext).not.toHaveBeenCalled()
  })

  it('advances on Enter when the value is valid', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(
      <TextStep label="Phone" type="tel" validate={isValidPhone} value="(555) 123-4567" onChange={vi.fn()} onNext={onNext} />,
    )
    await user.type(screen.getByRole('textbox'), '{Enter}')
    expect(onNext).toHaveBeenCalledOnce()
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

  it('shows the error message only after blur, when touched and invalid', async () => {
    const user = userEvent.setup()
    render(
      <TextStep
        label="Email"
        type="email"
        validate={isValidEmail}
        errorMessage="Please enter a valid email address"
        value="not-an-email"
        onChange={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    // not blurred yet → no error
    expect(screen.queryByText(/valid email address/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('textbox'))
    await user.tab() // blur
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
  })

  it('shows a "press Enter" hint', () => {
    render(<TextStep label="Phone" value="" onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText(/press enter/i)).toBeInTheDocument()
  })
})

describe('SelectStep (Typeform single-select via shadcn Select)', () => {
  const OPTIONS = [
    { value: 'arab', label: 'Arab' },
    { value: 'other', label: 'Other' },
  ]

  it('renders the label and a select trigger with the placeholder', () => {
    render(<SelectStep label="How do you identify?" options={OPTIONS} placeholder="Select one" onSelect={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('How do you identify?')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select one')).toBeInTheDocument()
  })

  it('calls onSelect with the chosen value when an option is picked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<SelectStep label="How do you identify?" options={OPTIONS} onSelect={onSelect} onNext={vi.fn()} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Other' }))
    expect(onSelect).toHaveBeenCalledWith('other')
  })

  it('shows a Continue button — disabled with no value, enabled once set — so a preserved answer can advance (Back-nav fix)', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<SelectStep label="X" options={OPTIONS} onSelect={vi.fn()} onNext={onNext} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(<SelectStep label="X" options={OPTIONS} value="other" onSelect={vi.fn()} onNext={onNext} />)
    const cta = screen.getByRole('button', { name: /continue/i })
    expect(cta).toBeEnabled()
    await user.click(cta)
    expect(onNext).toHaveBeenCalledOnce()
  })
})

describe('ComboboxStep (searchable combobox single-select)', () => {
  const OPTIONS = [
    { value: 'Arab', label: 'Arab' },
    { value: 'Bosnian', label: 'Bosnian' },
  ]

  it('renders the label and a combobox trigger', () => {
    render(<ComboboxStep label="How do you identify?" options={OPTIONS} onSelect={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('How do you identify?')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onSelect with the plain string value when an option is picked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ComboboxStep label="How do you identify?" options={OPTIONS} onSelect={onSelect} onNext={vi.fn()} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Bosnian' }))
    expect(onSelect).toHaveBeenCalledWith('Bosnian')
  })

  it('shows a Continue button — disabled with no value, enabled once set — so a preserved answer can advance (Back-nav fix)', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<ComboboxStep label="X" options={OPTIONS} onSelect={vi.fn()} onNext={onNext} />)
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
    rerender(<ComboboxStep label="X" options={OPTIONS} value="Bosnian" onSelect={vi.fn()} onNext={onNext} />)
    const cta = screen.getByRole('button', { name: /continue/i })
    expect(cta).toBeEnabled()
    await user.click(cta)
    expect(onNext).toHaveBeenCalledOnce()
  })
})

describe('DateStep (proven DatePicker + Continue, no premature advance)', () => {
  it('renders the label and a date-picker trigger; Continue disabled when empty', () => {
    render(<DateStep label="Your date of birth" value={undefined} onChange={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('Your date of birth')).toBeInTheDocument()
    expect(screen.getByText(/select your date of birth/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })

  it('does NOT auto-advance just because a value is present', () => {
    const onNext = vi.fn()
    render(<DateStep label="Your date of birth" value={new Date(1995, 5, 15)} onChange={vi.fn()} onNext={onNext} />)
    expect(onNext).not.toHaveBeenCalled()
  })

  it('advances only when Continue is clicked with a value set', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()
    render(<DateStep label="Your date of birth" value={new Date(1995, 5, 15)} onChange={vi.fn()} onNext={onNext} />)
    const cta = screen.getByRole('button', { name: /continue/i })
    expect(cta).toBeEnabled()
    await user.click(cta)
    expect(onNext).toHaveBeenCalledOnce()
  })
})
