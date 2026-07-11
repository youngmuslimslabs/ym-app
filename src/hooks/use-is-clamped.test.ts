import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsClamped } from './use-is-clamped'

function elementWith(scrollHeight: number, clientHeight: number) {
  const el = document.createElement('p')
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
  return el
}

describe('useIsClamped', () => {
  it('is true when content overflows the clamped box', () => {
    const ref = { current: elementWith(120, 60) }
    const { result } = renderHook(() => useIsClamped(ref, []))
    expect(result.current).toBe(true)
  })

  it('is false when content fits', () => {
    const ref = { current: elementWith(40, 60) }
    const { result } = renderHook(() => useIsClamped(ref, []))
    expect(result.current).toBe(false)
  })

  it('is false when the ref is unattached', () => {
    const ref = { current: null }
    const { result } = renderHook(() => useIsClamped(ref, []))
    expect(result.current).toBe(false)
  })
})
