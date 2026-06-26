import { render } from '@testing-library/react'
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
})
