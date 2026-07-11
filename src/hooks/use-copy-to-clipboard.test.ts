import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCopyToClipboard } from './use-copy-to-clipboard'

function setClipboard(value: unknown) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value,
    configurable: true,
    writable: true,
  })
}

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('copies text, flips copied true, then auto-resets after resetMs', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCopyToClipboard({ resetMs: 2000, onSuccess }))

    await act(async () => {
      await result.current.copy('ABC123')
    })

    expect(writeText).toHaveBeenCalledWith('ABC123')
    expect(result.current.copied).toBe(true)
    expect(onSuccess).toHaveBeenCalledOnce()

    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.copied).toBe(false)
  })

  it('reports async rejections via onError without setting copied', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) })
    const onError = vi.fn()
    const { result } = renderHook(() => useCopyToClipboard({ onError }))

    await act(async () => {
      await result.current.copy('x')
    })

    expect(onError).toHaveBeenCalledOnce()
    expect(result.current.copied).toBe(false)
  })

  it('catches a SYNCHRONOUS throw when the Clipboard API is unavailable', async () => {
    // Insecure/unsupported context: navigator.clipboard is undefined, so the
    // member access throws before any promise exists. The regression this guards
    // against is that a trailing .catch() would NOT see this.
    setClipboard(undefined)
    const onError = vi.fn()
    const { result } = renderHook(() => useCopyToClipboard({ onError }))

    await act(async () => {
      await expect(result.current.copy('x')).resolves.toBeUndefined()
    })

    expect(onError).toHaveBeenCalledOnce()
    expect(result.current.copied).toBe(false)
  })

  it('reset() clears the copied flag immediately', async () => {
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copy('x')
    })
    expect(result.current.copied).toBe(true)

    act(() => {
      result.current.reset()
    })
    expect(result.current.copied).toBe(false)
  })
})
