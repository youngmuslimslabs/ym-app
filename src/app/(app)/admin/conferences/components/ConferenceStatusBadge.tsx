import { getConferenceLifecycleStatus } from '../lib/lifecycle'
import type { Conference } from '../types'

type ConferenceLite = Pick<Conference, 'status' | 'start_date' | 'end_date'>

interface Props {
  status: Conference['status']
  start_date: string
  end_date: string
  showPulse?: boolean
}

// Renders Live / Draft / Past in the design-system colors. Lives in one
// component so the dashboard, editor header, and any future surfaces all
// agree on the visual treatment.
export function ConferenceStatusBadge({
  status,
  start_date,
  end_date,
  showPulse = true,
}: Props) {
  const lifecycle = getConferenceLifecycleStatus({ status, start_date, end_date })
  if (lifecycle === 'live') {
    return (
      <div className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-semibold gap-1.5">
        {showPulse && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
        )}
        Live
      </div>
    )
  }
  if (lifecycle === 'past') {
    return (
      <div className="inline-flex items-center rounded-md bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-semibold">
        Past
      </div>
    )
  }
  return (
    <div className="inline-flex items-center rounded-md border bg-background text-foreground px-2.5 py-0.5 text-xs font-semibold gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      Draft
    </div>
  )
}

export type { ConferenceLite }
