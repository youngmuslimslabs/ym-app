import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckInDialog } from './CheckInDialog'

describe('CheckInDialog', () => {
  const noop = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    noop.mockClear()
  })

  describe('already checked in', () => {
    it('shows success card', () => {
      render(
        <CheckInDialog alreadyCheckedIn pending={false} error={null} onSubmit={noop} />,
      )
      expect(screen.getByText("You're checked in")).toBeInTheDocument()
    })

    it('does not render the code input', () => {
      render(
        <CheckInDialog alreadyCheckedIn pending={false} error={null} onSubmit={noop} />,
      )
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('idle state (not checked in, no error)', () => {
    it('renders text input with correct prompt', () => {
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={noop} />,
      )
      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByText('Enter the check-in code from the speaker.')).toBeInTheDocument()
    })

    it('button is disabled when input is empty', () => {
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={noop} />,
      )
      expect(screen.getByRole('button', { name: /check in/i })).toBeDisabled()
    })

    it('button enables once a non-whitespace code is typed', async () => {
      const user = userEvent.setup()
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={noop} />,
      )
      await user.type(screen.getByRole('textbox'), 'ABC1')
      expect(screen.getByRole('button', { name: /check in/i })).toBeEnabled()
    })

    it('button stays disabled for whitespace-only input', async () => {
      const user = userEvent.setup()
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={noop} />,
      )
      await user.type(screen.getByRole('textbox'), '   ')
      expect(screen.getByRole('button', { name: /check in/i })).toBeDisabled()
    })
  })

  describe('submitting a code', () => {
    it('calls onSubmit with trimmed value on button click', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={onSubmit} />,
      )
      await user.type(screen.getByRole('textbox'), 'GATE')
      await user.click(screen.getByRole('button', { name: /check in/i }))
      expect(onSubmit).toHaveBeenCalledOnce()
      expect(onSubmit).toHaveBeenCalledWith('GATE')
    })

    it('calls onSubmit with trimmed value on Enter key', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={onSubmit} />,
      )
      await user.type(screen.getByRole('textbox'), 'GATE{Enter}')
      expect(onSubmit).toHaveBeenCalledOnce()
      expect(onSubmit).toHaveBeenCalledWith('GATE')
    })

    it('does not call onSubmit on Enter when input is empty', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const user = userEvent.setup()
      render(
        <CheckInDialog alreadyCheckedIn={false} pending={false} error={null} onSubmit={onSubmit} />,
      )
      await user.type(screen.getByRole('textbox'), '{Enter}')
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('error state', () => {
    it('shows error heading and subtext', () => {
      render(
        <CheckInDialog
          alreadyCheckedIn={false}
          pending={false}
          error="Invalid code"
          onSubmit={noop}
        />,
      )
      expect(screen.getByText("That code didn't match")).toBeInTheDocument()
      expect(screen.getByText('Double-check the code with the speaker.')).toBeInTheDocument()
    })

    it('button label changes to "Try again"', () => {
      render(
        <CheckInDialog
          alreadyCheckedIn={false}
          pending={false}
          error="Invalid code"
          onSubmit={noop}
        />,
      )
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })
  })

  describe('pending state', () => {
    it('shows "Checking in…" label on the button', () => {
      render(
        <CheckInDialog alreadyCheckedIn={false} pending error={null} onSubmit={noop} />,
      )
      expect(screen.getByRole('button', { name: /checking in/i })).toBeInTheDocument()
    })
  })

  describe('grace period', () => {
    it('shows urgency copy and still renders the input when inGracePeriod', () => {
      render(
        <CheckInDialog
          alreadyCheckedIn={false}
          pending={false}
          error={null}
          inGracePeriod
          onSubmit={noop}
        />,
      )
      expect(screen.getByText('Session ended — check in now')).toBeInTheDocument()
      expect(
        screen.getByText('You have a few minutes left to check in before it closes.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('error copy takes precedence over grace copy', () => {
      render(
        <CheckInDialog
          alreadyCheckedIn={false}
          pending={false}
          error="Invalid code"
          inGracePeriod
          onSubmit={noop}
        />,
      )
      expect(screen.getByText("That code didn't match")).toBeInTheDocument()
      expect(screen.queryByText('Session ended — check in now')).not.toBeInTheDocument()
    })
  })
})
