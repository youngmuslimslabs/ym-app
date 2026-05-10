import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConferenceOnboardingBanner } from './ConferenceOnboardingBanner'

const CONF_ID = 'test-conf-abc'
const STORAGE_KEY = `ym_conf_onboarding_v1_${CONF_ID}`

describe('ConferenceOnboardingBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders all three steps when conference has not been dismissed', async () => {
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    // findBy* waits for the useEffect state update to flush
    expect(await screen.findByText('Sign up for sessions before they fill up')).toBeInTheDocument()
    expect(screen.getByText('At each session, enter the code to check in')).toBeInTheDocument()
    expect(screen.getByText('Rate each session after checking in')).toBeInTheDocument()
  })

  it('renders a dismiss button', async () => {
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    expect(await screen.findByRole('button', { name: /dismiss/i })).toBeInTheDocument()
  })

  it('does not render when the conference was previously dismissed', async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    await waitFor(() => {
      expect(screen.queryByText('Sign up for sessions before they fill up')).not.toBeInTheDocument()
    })
  })

  it('hides the banner when dismiss is clicked', async () => {
    const user = userEvent.setup()
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    await user.click(await screen.findByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Sign up for sessions before they fill up')).not.toBeInTheDocument()
  })

  it('persists dismissal to localStorage with correct key', async () => {
    const user = userEvent.setup()
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    await user.click(await screen.findByRole('button', { name: /dismiss/i }))
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
  })

  it('uses a separate localStorage key per conference', async () => {
    localStorage.setItem(STORAGE_KEY, '1')
    render(<ConferenceOnboardingBanner conferenceId="different-conf-id" />)
    // Different conference → different key → banner should show
    expect(
      await screen.findByText('Sign up for sessions before they fill up'),
    ).toBeInTheDocument()
  })

  it('renders nothing when localStorage throws (private browsing)', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError')
    })
    render(<ConferenceOnboardingBanner conferenceId={CONF_ID} />)
    await waitFor(() => {
      expect(screen.queryByText('Sign up for sessions before they fill up')).not.toBeInTheDocument()
    })
  })
})
