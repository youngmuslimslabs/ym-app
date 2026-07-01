import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInit } = vi.hoisted(() => ({ mockInit: vi.fn() }))

vi.mock('posthog-js', () => ({
  default: { init: mockInit, capture: vi.fn() },
}))
vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { PHProvider } from '../providers'

describe('PHProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders children', () => {
    const { getByText } = render(<PHProvider><p>hello</p></PHProvider>)
    expect(getByText('hello')).toBeDefined()
  })

  it('initialises posthog with correct config', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key')
    await act(async () => {
      render(<PHProvider><p>test</p></PHProvider>)
    })
    expect(mockInit).toHaveBeenCalledOnce()
    expect(mockInit).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        capture_pageview: false,
        person_profiles: 'identified_only',
      })
    )
  })
})
