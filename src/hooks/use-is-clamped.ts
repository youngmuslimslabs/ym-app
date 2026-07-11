'use client'

import { useEffect, useState, type DependencyList, type RefObject } from 'react'

// Returns true when the referenced element's content overflows its clamped
// box (e.g. `line-clamp-3`), i.e. when a "See more" affordance is warranted.
// Recomputes on the given `deps` AND on element resize, so narrowing/widening
// the container re-evaluates truncation instead of leaving a stale one-shot
// measurement. Shared by the attendee SessionCard and the admin SessionPanel.
export function useIsClamped<T extends HTMLElement>(
  ref: RefObject<T | null>,
  deps: DependencyList = []
): boolean {
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      setClamped(false)
      return
    }
    const measure = () => setClamped(el.scrollHeight > el.clientHeight)
    measure()
    // ResizeObserver may be absent in older/non-DOM environments; the initial
    // measure() above still runs, we just skip live resize updates.
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // `deps` is spread intentionally; callers pass the content that changes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps])

  return clamped
}
