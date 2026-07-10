import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompletionStrip } from './CompletionStrip'

describe('CompletionStrip', () => {
  it('shows the finish prompt with progress', () => {
    render(<CompletionStrip resolvedCount={3} total={6} percent={50} onClick={vi.fn()} />)
    expect(screen.getByText(/finish setting up your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/3 of 6/i)).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<CompletionStrip resolvedCount={3} total={6} percent={50} onClick={onClick} />)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
