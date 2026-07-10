import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The component instantiates a Supabase client at module load — stub it.
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithIdToken: vi.fn() } }),
}))

// next/script is irrelevant here: we drive rendering through the mount effect's
// `if (window.google) renderGoogleButton()` path by putting the GIS SDK on window
// before render, so the <Script> onLoad never needs to fire.
vi.mock('next/script', () => ({ default: () => null }))

import GoogleSignInButton from '../GoogleSignInButton'

const renderButton = vi.fn()
const initialize = vi.fn()
const cancel = vi.fn()

function stubContainerWidth(width: number) {
  // jsdom doesn't lay out, so getBoundingClientRect().width is 0 by default.
  // The component bails on a 0 width (its "not laid out yet" guard), so we must
  // give the container a real measured width or renderButton is never called.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 40,
    top: 0,
    left: 0,
    right: width,
    bottom: 40,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id')
    // Pretend the GIS SDK is already loaded so the mount effect renders.
    ;(window as unknown as { google: unknown }).google = {
      accounts: { id: { initialize, cancel, renderButton } },
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    delete (window as unknown as { google?: unknown }).google
  })

  it('renders the Google button with an explicit numeric width matching the container', async () => {
    stubContainerWidth(334)
    await act(async () => {
      render(<GoogleSignInButton />)
    })

    expect(renderButton).toHaveBeenCalled()
    const options = renderButton.mock.calls[0][1]
    // The core of the centering fix: GIS must be given a concrete width so its
    // fixed-width iframe fills the slot instead of measuring nondeterministically.
    expect(typeof options.width).toBe('number')
    expect(options.width).toBe(334)
  })

  it("clamps the width to Google's 400px maximum", async () => {
    stubContainerWidth(640)
    await act(async () => {
      render(<GoogleSignInButton />)
    })

    const options = renderButton.mock.calls[0][1]
    expect(options.width).toBe(400)
  })

  it('does not render the button when the container has no measured width yet', async () => {
    stubContainerWidth(0)
    await act(async () => {
      render(<GoogleSignInButton />)
    })

    // With width 0 the component defers to the ResizeObserver rather than baking
    // in a wrong width — so renderButton must not be called on this pass.
    expect(renderButton).not.toHaveBeenCalled()
  })
})
