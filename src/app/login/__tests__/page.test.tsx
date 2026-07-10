import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPush, mockGetSession, mockGetUser, mockCheckOnboarding } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetUser: vi.fn(),
  mockCheckOnboarding: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// No authenticated user on mount, so the "already logged in" redirect effect
// stays dormant and we exercise only the post-sign-in success path.
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getSession: mockGetSession, getUser: mockGetUser } }),
}))

vi.mock('@/lib/supabase/onboarding', () => ({
  checkOnboardingComplete: mockCheckOnboarding,
}))

// Stub the form so we can fire the onSuccess callback the page wires up.
vi.mock('@/components/auth/YMLoginForm', () => ({
  YMLoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={() => onSuccess()}>trigger-success</button>
  ),
}))

import LoginPage from '../page'

describe('LoginPage redirect after Google sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } })
    mockCheckOnboarding.mockResolvedValue(true)
  })

  it('uses getSession (local read) and never getUser (network round-trip) on success', async () => {
    render(<LoginPage />)
    await act(async () => {
      fireEvent.click(screen.getByText('trigger-success'))
    })

    await waitFor(() => expect(mockPush).toHaveBeenCalled())
    // The lag fix: read the session locally instead of re-validating via the
    // Auth server. getUser must not be on the critical path to navigation.
    expect(mockGetSession).toHaveBeenCalledOnce()
    expect(mockGetUser).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/home')
  })

  it('routes an unonboarded user to onboarding', async () => {
    mockCheckOnboarding.mockResolvedValue(false)
    render(<LoginPage />)
    await act(async () => {
      fireEvent.click(screen.getByText('trigger-success'))
    })

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding?step=1'))
  })
})
