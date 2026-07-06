'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Sparkles, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  SECTION_LABELS,
  SECTION_ORDER,
  useProfileCompletion,
} from '@/contexts/ProfileCompletionContext'

// The always-visible half of the pattern: a persistent, dismissible card that
// shows how close the profile is and which sections are still open (a Zeigarnik
// open loop). Styling mirrors ConferenceOnboardingBanner (border-primary/20 +
// bg-primary/5) so it reads as part of the app. Retires itself at 100%.
export function ProfileCompletionCard() {
  const { completion, isComplete, markComplete } = useProfileCompletion()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Self-retiring "complete" state — the nag becomes a quiet acknowledgement.
  if (isComplete) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div className="rounded-full bg-primary/10 p-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Profile complete <span className="text-primary">✓</span>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Finish setting up your profile
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-0.5 text-primary/60 transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Progress value={completion.percent} className="flex-1" />
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          {completion.percent}% complete
        </span>
      </div>

      <ul className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {SECTION_ORDER.map((key) => {
          const done = completion.sections[key]
          const Icon = done ? CheckCircle2 : Circle
          return (
            <li key={key} className="flex items-center gap-2 text-sm">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${done ? 'text-primary' : 'text-muted-foreground/40'}`}
              />
              <span
                className={
                  done ? 'text-muted-foreground line-through' : 'text-foreground/80'
                }
              >
                {SECTION_LABELS[key]}
              </span>
            </li>
          )
        })}
      </ul>

      <Button size="sm" onClick={markComplete}>
        Finish your profile
      </Button>
    </div>
  )
}
