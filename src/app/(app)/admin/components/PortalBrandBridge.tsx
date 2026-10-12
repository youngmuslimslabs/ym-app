'use client'

import { useEffect } from 'react'
import type { Side } from '@/lib/side'

// Classes BrandScope puts on its own element, minus the page background: a
// portal'd popup keeps its own surface colours, it only needs the tokens, the
// Figtree face and the tracking.
const SCOPE_CLASSES = ['font-sans', 'tracking-brand', 'text-foreground']

/**
 * Carries the brand scope into portals. Radix renders dialogs, sheets, selects,
 * date pickers, menus and tooltips as a new <div> directly under <body>, which
 * is outside <BrandScope>, so they would show the legacy blue, Geist and the
 * unthemed surfaces on top of a branded page.
 *
 * While the admin route is mounted this watches <body> and stamps every newly
 * added <div> with the same `data-theme` / `data-theme-side` the page has, so
 * the portal'd content resolves the brand tokens. It leaves the sidebar, the
 * toaster and every other route alone (nothing is set on <body> itself), and
 * it stops when the admin route unmounts.
 *
 * Renders nothing. Lives in this route because the brief for this rollout is to
 * not touch shared `ui/` primitives; if more screens need it, it can move into
 * `components/brand/` and be mounted by `BrandScope`.
 */
export function PortalBrandBridge({ side }: { side?: Side | null }) {
  useEffect(() => {
    const body = document.body

    function stamp(el: HTMLElement) {
      if (el.tagName !== 'DIV' || el.hasAttribute('data-theme')) return
      el.setAttribute('data-theme', 'ym')
      if (side) el.setAttribute('data-theme-side', side)
      el.classList.add(...SCOPE_CLASSES)
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) stamp(node)
        })
      }
    })
    observer.observe(body, { childList: true })
    return () => observer.disconnect()
  }, [side])

  return null
}
