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

  it('still resizes when the embed script already exists at mount (regression)', () => {
    // Pre-seed the embed-handler script so the component mounts straight into
    // the "script already present" branch — the exact case the old code
    // early-returned on, skipping the message-listener setup. This test fails on
    // the pre-fix code (no listener -> iframe stays at its initial height).
    const existing = document.createElement('script')
    existing.src = 'https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js'
    document.body.appendChild(existing)

    render(<JotformEmbed formId="123" title="Test Form" />)
    const iframe = screen.getByTitle('Test Form') as HTMLIFrameElement

    sendHeight(1800)

    expect(iframe.style.height).toBe('1800px')
  })
})
