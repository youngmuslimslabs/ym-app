'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, QrCode, Star, X } from 'lucide-react'

interface Props {
  conferenceId: string
}

const STEPS = [
  {
    icon: CheckCircle2,
    text: 'Sign up for sessions before they fill up',
  },
  {
    icon: QrCode,
    text: 'At each session, enter the code to check in',
  },
  {
    icon: Star,
    text: 'Rate each session after checking in',
  },
]

export function ConferenceOnboardingBanner({ conferenceId }: Props) {
  const storageKey = `ym_conf_onboarding_v1_${conferenceId}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey)
      if (!dismissed) setVisible(true)
    } catch {
      // localStorage unavailable (private browsing, etc.) — skip the banner
    }
  }, [storageKey])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mx-auto mt-8 max-w-5xl px-6 sm:px-10">
      <section
        aria-label="How it works"
        className="rounded-2xl border bg-card p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="ym-eyebrow text-primary">How it works</p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <ol className="mt-1 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STEPS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="flex items-start gap-3">
              <div className="shrink-0 rounded-full bg-primary/10 p-2.5">
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </div>
              <div>
                <span className="ym-eyebrow block text-xs text-muted-foreground">
                  Step {i + 1}
                </span>
                <p className="mt-0.5 text-sm leading-snug">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
