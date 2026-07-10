import { useCallback, useState } from 'react'

export interface OnboardingFlow {
  stepId: string
  index: number
  total: number
  isFirst: boolean
  isLast: boolean
  next: () => void
  back: () => void
  answers: Record<string, unknown>
  setAnswer: (id: string, value: unknown) => void
}

/**
 * Navigation + answer state for the Part-1 onboarding typeform.
 * `next()`/`back()` are clamped to the flow bounds; answers persist across
 * navigation so Back never loses what the user already entered.
 */
export function useOnboardingFlow(steps: string[]): OnboardingFlow {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const back = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const setAnswer = useCallback((id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }, [])

  return {
    stepId: steps[index],
    index,
    total: steps.length,
    isFirst: index === 0,
    isLast: index === steps.length - 1,
    next,
    back,
    answers,
    setAnswer,
  }
}
