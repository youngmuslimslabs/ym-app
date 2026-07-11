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

// jsdom lacks matchMedia, which useIsMobile() (now used by form primitives like
// SearchableCombobox / DatePicker / ResponsiveSelect) calls in an effect. Stub it
// as a non-matching query so those components default to the desktop branch;
// mobile-specific tests override by mocking '@/hooks/use-mobile'. Test-only.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

afterEach(() => {
  cleanup()
})
