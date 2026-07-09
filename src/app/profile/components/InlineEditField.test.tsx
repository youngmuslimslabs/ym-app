import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { InlineEditField } from './InlineEditField'

describe('InlineEditField — text commit behavior', () => {
  it('commits the typed value when focus leaves via the keyboard (Tab/blur)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InlineEditField type="text" label="Nickname" value="" onChange={onChange} />)

    // Enter edit mode
    await user.click(screen.getByRole('button', { name: /click to add/i }))
    await user.type(screen.getByRole('textbox'), 'Zed')

    // Move focus away with the keyboard — this is the case that used to drop the edit
    await user.tab()

    expect(onChange).toHaveBeenCalledWith('Zed')
  })

  it('still commits on Enter (regression guard)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InlineEditField type="text" label="Nickname" value="" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /click to add/i }))
    await user.type(screen.getByRole('textbox'), 'Ali{Enter}')

    expect(onChange).toHaveBeenCalledWith('Ali')
  })

  it('does not commit an invalid value on blur and surfaces the error', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <InlineEditField
        type="text"
        label="Nickname"
        value=""
        onChange={onChange}
        validator={(v) => v.length >= 3}
        errorMessage="Too short"
      />
    )

    await user.click(screen.getByRole('button', { name: /click to add/i }))
    await user.type(screen.getByRole('textbox'), 'Ze') // too short
    await user.tab()

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('associates the label with the input so it is reachable by its accessible name', async () => {
    const user = userEvent.setup()
    render(<InlineEditField type="text" label="Nickname" value="" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /click to add/i }))

    // getByLabelText resolves only when <Label htmlFor> is wired to the input id
    expect(screen.getByLabelText('Nickname')).toBe(screen.getByRole('textbox'))
  })

  it('does not commit when Escape is pressed (cancel)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<InlineEditField type="text" label="Nickname" value="Original" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /original/i }))
    await user.type(screen.getByRole('textbox'), 'X')
    await user.keyboard('{Escape}')

    expect(onChange).not.toHaveBeenCalled()
  })
})
