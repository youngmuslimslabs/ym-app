import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'

import { JotformEmbed } from './JotformEmbed'

afterEach(() => {
  cleanup()
  // Remove any embed-handler script added during a test
  document.querySelectorAll('script[src*="for-form-embed-handler"]').forEach((s) => s.remove())
})

function sendHeight(px: number) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: `setHeight:${px}` }))
  })
}

describe('JotformEmbed — auto-resize', () => {
  it('resizes the iframe when Jotform posts a setHeight message', () => {
    render(<JotformEmbed formId="123" title="Test Form" />)
    const iframe = screen.getByTitle('Test Form') as HTMLIFrameElement

    sendHeight(1500)

    expect(iframe.style.height).toBe('1500px')
  })

  it('still resizes on a remount when the embed script already exists (regression)', () => {
    // First mount loads the script...
    const first = render(<JotformEmbed formId="123" title="Test Form" />)
    expect(document.querySelector('script[src*="for-form-embed-handler"]')).not.toBeNull()
    first.unmount()

    // ...second mount must still register its message listener even though the
    // script is already in the DOM.
    render(<JotformEmbed formId="123" title="Test Form" />)
    const iframe = screen.getByTitle('Test Form') as HTMLIFrameElement

    sendHeight(1800)

    expect(iframe.style.height).toBe('1800px')
  })
})
