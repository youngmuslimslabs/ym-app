import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useOnboardingFlow } from './useOnboardingFlow'

const STEPS = ['phone', 'email', 'ethnicity']

describe('useOnboardingFlow', () => {
  it('starts on the first step', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    expect(result.current.stepId).toBe('phone')
    expect(result.current.index).toBe(0)
    expect(result.current.isFirst).toBe(true)
    expect(result.current.isLast).toBe(false)
  })

  it('advances to the next step on next()', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    act(() => result.current.next())
    expect(result.current.stepId).toBe('email')
    expect(result.current.index).toBe(1)
    expect(result.current.isFirst).toBe(false)
  })

  it('goes back on back()', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    act(() => result.current.next())
    act(() => result.current.back())
    expect(result.current.stepId).toBe('phone')
    expect(result.current.index).toBe(0)
  })

  it('does not go back past the first step', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    act(() => result.current.back())
    expect(result.current.index).toBe(0)
  })

  it('marks the last step as last and does not advance past it', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.isLast).toBe(true)
    act(() => result.current.next())
    expect(result.current.index).toBe(2)
  })

  it('stores answers and preserves them across next() then back()', () => {
    const { result } = renderHook(() => useOnboardingFlow(STEPS))
    act(() => result.current.setAnswer('phone', '(555) 123-4567'))
    act(() => result.current.next())
    act(() => result.current.back())
    expect(result.current.answers.phone).toBe('(555) 123-4567')
  })
})
