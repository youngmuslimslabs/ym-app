import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EnterAppButton } from './EnterAppButton'

describe('EnterAppButton (#61)', () => {
  it('stays pending after a successful save so a re-tap cannot re-run it', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn().mockResolvedValue(true)
    render(<EnterAppButton onEnter={onEnter} />)

    await user.click(screen.getByRole('button', { name: 'Enter the app' }))

    const button = await screen.findByRole('button', { name: 'Entering…' })
    await waitFor(() => expect(onEnter).toHaveBeenCalledTimes(1))
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('hands the button back when the save fails', async () => {
    const user = userEvent.setup()
    const onEnter = vi.fn().mockResolvedValue(false)
    render(<EnterAppButton onEnter={onEnter} />)

    await user.click(screen.getByRole('button', { name: 'Enter the app' }))

    const button = await screen.findByRole('button', { name: 'Enter the app' })
    expect(button).toBeEnabled()
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})
