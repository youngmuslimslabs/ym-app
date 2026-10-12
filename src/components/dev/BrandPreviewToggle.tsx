'use client'

import { useEffect, useState } from 'react'

/**
 * Preview-only switch that applies the Young Muslims brand theme to the WHOLE
 * app, so the redesign can be judged on real screens before any screen adopts
 * it for real. Off by default, remembered per browser.
 *
 * It only exists when NEXT_PUBLIC_BRAND_PREVIEW=1, which is set for local runs
 * and Netlify deploy previews and never for production. In a production build
 * this component renders nothing and never touches the DOM. Nothing here edits
 * a screen: it only sets `data-theme` / `data-side` on <html>, which the tokens
 * in globals.css already key off.
 *
 * Also works via URL: ?brand=ym | brothers | sisters | off
 */
const ENABLED = process.env.NEXT_PUBLIC_BRAND_PREVIEW === '1'
const STORAGE_KEY = 'ym-brand-preview'

const OPTIONS = [
  { value: 'off', label: 'Current' },
  { value: 'ym', label: 'General' },
  { value: 'brothers', label: 'Brothers' },
  { value: 'sisters', label: 'Sisters' },
] as const
type Mode = (typeof OPTIONS)[number]['value']

function isMode(v: string | null): v is Mode {
  return OPTIONS.some((o) => o.value === v)
}

function apply(mode: Mode) {
  const root = document.documentElement
  if (mode === 'off') {
    delete root.dataset.theme
    delete root.dataset.side
    return
  }
  // General is the base scope; Brothers/Sisters sit on top of it.
  root.dataset.theme = 'ym'
  if (mode === 'ym') delete root.dataset.side
  else root.dataset.side = mode
}

function readStored(): Mode {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('brand')
    if (isMode(fromUrl)) return fromUrl
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isMode(stored) ? stored : 'off'
  } catch {
    return 'off'
  }
}

export function BrandPreviewToggle() {
  const [mode, setMode] = useState<Mode>('off')

  useEffect(() => {
    if (!ENABLED) return
    const initial = readStored()
    setMode(initial)
    apply(initial)
  }, [])

  if (!ENABLED) return null

  function choose(next: Mode) {
    setMode(next)
    apply(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be blocked (private window); the switch still works.
    }
  }

  return (
    <div
      role="group"
      aria-label="Brand preview"
      className="fixed bottom-3 right-3 z-[100] flex items-center gap-1 rounded-full border bg-card p-1 text-xs shadow-lg"
    >
      <span className="px-2 font-medium text-muted-foreground">Brand preview</span>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={mode === o.value}
          onClick={() => choose(o.value)}
          className={
            mode === o.value
              ? 'rounded-full bg-foreground px-2.5 py-1 font-medium text-background'
              : 'rounded-full px-2.5 py-1 text-foreground hover:bg-muted'
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
