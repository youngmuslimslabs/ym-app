import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLastNonNull } from './use-last-non-null'

describe('useLastNonNull', () => {
  it('returns null until a value arrives', () => {
    const { result } = renderHook(() => useLastNonNull<string>(null))
    expect(result.current).toBeNull()
  })

  it('holds the last value after it goes null', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) => useLastNonNull(value),
      { initialProps: { value: 'a' as string | null } }
    )
    expect(result.current).toBe('a')
    rerender({ value: null })
    expect(result.current).toBe('a')
  })

  it('switches immediately to a new value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string | null }) => useLastNonNull(value),
      { initialProps: { value: 'a' as string | null } }
    )
    rerender({ value: null })
    rerender({ value: 'b' })
    expect(result.current).toBe('b')
    rerender({ value: null })
    expect(result.current).toBe('b')
  })
})
