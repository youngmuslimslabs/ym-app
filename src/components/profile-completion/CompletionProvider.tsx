'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

import type { ProfileCompletion } from '@/lib/profile-completion'

import { CompletionGate } from './CompletionGate'

interface CompletionContextValue {
  completion: ProfileCompletion
  isComplete: boolean
  /** Run `proceed` if the profile is complete; otherwise open the gate for `action`. */
  requireComplete: (action: string, proceed: () => void) => void
}

const CompletionContext = createContext<CompletionContextValue | undefined>(undefined)

export function CompletionProvider({
  completion,
  onGoToComplete,
  children,
}: {
  completion: ProfileCompletion
  onGoToComplete: () => void
  children: ReactNode
}) {
  const [gateAction, setGateAction] = useState<string | null>(null)
  const isComplete = completion.isComplete

  const requireComplete = useCallback(
    (action: string, proceed: () => void) => {
      if (isComplete) {
        proceed()
      } else {
        setGateAction(action)
      }
    },
    [isComplete],
  )

  return (
    <CompletionContext.Provider value={{ completion, isComplete, requireComplete }}>
      {children}
      <CompletionGate
        open={gateAction !== null}
        action={gateAction ?? ''}
        onDismiss={() => setGateAction(null)}
        onGoToComplete={() => {
          setGateAction(null)
          onGoToComplete()
        }}
      />
    </CompletionContext.Provider>
  )
}

export function useCompletion() {
  const ctx = useContext(CompletionContext)
  if (!ctx) {
    throw new Error('useCompletion must be used within CompletionProvider')
  }
  return ctx
}
