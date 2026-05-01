'use client'

import { useCallback, useEffect, useRef, type TouchEvent } from 'react'

interface Options {
  onDismiss: () => void
  threshold?: number
}

interface DragHandleProps {
  onTouchStart: (e: TouchEvent<HTMLDivElement>) => void
  onTouchMove: (e: TouchEvent<HTMLDivElement>) => void
  onTouchEnd: (e: TouchEvent<HTMLDivElement>) => void
}

interface Result {
  sheetRef: (node: HTMLDivElement | null) => void
  dragHandleProps: DragHandleProps
}

// Drag-to-dismiss for bottom-sheet variants. The drag handle owns the touch
// handlers; the SheetContent gets `sheetRef` so we can translate it directly
// during touchmove (DOM mutation, not React state — 60fps tracking without
// re-renders). Below threshold the sheet snaps back via a transition; above
// threshold we keep the inline transform set when calling `onDismiss`, so
// Radix's slide-out keyframe picks up smoothly from the finger's last position
// instead of jumping back to 0 (its `from` falls back to the element's
// underlying computed transform).
//
// We intentionally don't preventDefault on touchmove — React 17+ attaches
// touch listeners as passive, so it'd no-op anyway. The drag handle uses
// `touch-none` (Tailwind) which sets `touch-action: none`, blocking iOS
// pull-to-refresh and scroll while the gesture is in flight.
export function useBottomSheetDragToDismiss({
  onDismiss,
  threshold = 60,
}: Options): Result {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const startYRef = useRef<number | null>(null)
  const snapBackTimeoutRef = useRef<number | null>(null)

  const sheetRef = useCallback((node: HTMLDivElement | null) => {
    elementRef.current = node
    if (node) {
      // On mount, clear any inline transform/transition that might have
      // leaked from a previous gesture if Radix reuses the same DOM node
      // across opens. No-op on a clean first mount; defensive otherwise.
      node.style.transform = ''
      node.style.transition = ''
    }
  }, [])

  // Cancel any pending snap-back animation if the component unmounts mid-flight
  // (e.g. user swipes below threshold then closes via Esc / backdrop within the
  // 200ms window). The timeout's body is already guarded against a null ref, so
  // this is hygiene rather than a correctness fix.
  useEffect(() => {
    return () => {
      if (snapBackTimeoutRef.current !== null) {
        window.clearTimeout(snapBackTimeoutRef.current)
      }
    }
  }, [])

  const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    startYRef.current = e.touches[0]?.clientY ?? null

    if (snapBackTimeoutRef.current !== null) {
      window.clearTimeout(snapBackTimeoutRef.current)
      snapBackTimeoutRef.current = null
    }
    const el = elementRef.current
    if (el) {
      el.style.transition = 'none'
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return
    const currentY = e.touches[0]?.clientY ?? startYRef.current
    const deltaY = Math.max(0, currentY - startYRef.current)
    const el = elementRef.current
    if (el) {
      el.style.transform = `translateY(${deltaY}px)`
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (startYRef.current === null) return
      const endY = e.changedTouches[0]?.clientY ?? startYRef.current
      const deltaY = endY - startYRef.current
      startYRef.current = null

      const el = elementRef.current

      if (deltaY > threshold) {
        // Leave the inline transform in place. Radix sets data-state=closed on
        // dismiss, and its exit keyframe ("to: translate-y-full") implicitly
        // animates *from* this transform — so the sheet flows smoothly from
        // the finger's last position to fully off-screen.
        onDismiss()
        return
      }

      if (!el) return
      el.style.transition = 'transform 200ms ease-out'
      el.style.transform = 'translateY(0)'
      snapBackTimeoutRef.current = window.setTimeout(() => {
        const cleanupEl = elementRef.current
        if (cleanupEl) {
          cleanupEl.style.transform = ''
          cleanupEl.style.transition = ''
        }
        snapBackTimeoutRef.current = null
      }, 200)
    },
    [onDismiss, threshold]
  )

  return {
    sheetRef,
    dragHandleProps: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
