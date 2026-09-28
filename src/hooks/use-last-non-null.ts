'use client'

import { useState } from 'react'

// Returns `value` while it's non-null, and the last non-null value after it
// goes null. Lets a Sheet/Dialog keep rendering its content (and its `side`)
// through Radix's exit animation instead of swapping to an empty placeholder
// mid-close. Pass a stable value (an id or a memoized object) — a fresh object
// every render would re-set state on every render.
export function useLastNonNull<T>(value: T | null): T | null {
  const [last, setLast] = useState<T | null>(value)
  if (value !== null && value !== last) setLast(value)
  return value ?? last
}
