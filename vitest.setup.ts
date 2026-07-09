import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks the pointer-capture + scroll + ResizeObserver APIs that Radix UI
// primitives (e.g. shadcn <Select>) call during open/close. Shim them so those
// components can be driven in tests. Test-only — no production effect.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  cleanup()
})
