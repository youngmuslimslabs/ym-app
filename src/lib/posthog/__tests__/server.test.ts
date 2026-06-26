import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(function (this: object) {
    Object.assign(this, {
      capture: vi.fn(),
      captureException: vi.fn(),
      shutdown: vi.fn(),
    })
  }),
}))

describe('getPostHogServer', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a PostHog instance', async () => {
    const { getPostHogServer } = await import('../server')
    const client = getPostHogServer()
    expect(client).toBeDefined()
    expect(client.capture).toBeDefined()
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    const { getPostHogServer } = await import('../server')
    const a = getPostHogServer()
    const b = getPostHogServer()
    expect(a).toBe(b)
  })
})
