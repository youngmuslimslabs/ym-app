'use client'

import { useEffect } from 'react'
import './variations.css'

export type SidebarTone = 'themed' | 'obsidian' | 'light'

/**
 * Preview only: recolours the app sidebar while a variation is on screen, by
 * setting data-sidebar-tone on <html> (see variations.css). If a tone is
 * chosen, it moves into the real theme tokens in globals.css.
 */
export function SidebarToneSwitch({ tone }: { tone: SidebarTone }) {
  useEffect(() => {
    const root = document.documentElement
    if (tone === 'themed') return
    root.setAttribute('data-sidebar-tone', tone)
    return () => root.removeAttribute('data-sidebar-tone')
  }, [tone])
  return null
}
