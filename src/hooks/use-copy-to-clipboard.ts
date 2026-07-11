'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseCopyToClipboardOptions {
  /** How long the `copied` flag stays true before auto-resetting (ms). */
  resetMs?: number
  onSuccess?: () => void
  onError?: (err: unknown) => void
}

// Copies text to the clipboard and exposes a transient `copied` flag that
// auto-resets after `resetMs`. The write is wrapped in try/catch so a
// SYNCHRONOUS throw — `navigator.clipboard` is undefined in insecure (non-HTTPS)
// or unsupported contexts, so the member access throws before any promise
// exists — is surfaced via `onError` instead of escaping as an uncaught error
// (which a trailing `.catch()` on the promise cannot see). The reset timer is
// cleared on unmount, and `reset()` lets callers clear the flag when context
// changes (e.g. switching to a different item).
export function useCopyToClipboard({
  resetMs = 2000,
  onSuccess,
  onError,
}: UseCopyToClipboardOptions = {}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  useEffect(() => clearTimer, [clearTimer])

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        clearTimer()
        setCopied(true)
        timer.current = setTimeout(() => setCopied(false), resetMs)
        onSuccess?.()
      } catch (err) {
        onError?.(err)
      }
    },
    [resetMs, onSuccess, onError, clearTimer]
  )

  const reset = useCallback(() => {
    clearTimer()
    setCopied(false)
  }, [clearTimer])

  return { copied, copy, reset }
}
