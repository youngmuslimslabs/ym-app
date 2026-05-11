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
    <div className="mx-6 md:mx-8 mt-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          How it works
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md p-0.5 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {STEPS.map(({ icon: Icon, text }, i) => (
          <div key={text} className="flex items-start gap-2.5 flex-1">
            <div className="rounded-full bg-primary/10 p-1.5 shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/60 block mb-0.5">
                Step {i + 1}
              </span>
              <p className="text-sm text-foreground/80 leading-snug">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
