import { getConferenceLifecycleStatus } from '../lib/lifecycle'
import type { Conference } from '../types'

type ConferenceLite = Pick<Conference, 'status' | 'start_date' | 'end_date'>

interface Props {
  status: Conference['status']
  start_date: string
  end_date: string
  showPulse?: boolean
}

// Renders Live / Draft / Past as pills in the brand tokens (Live is the same
// success green as Home's "Happening now"). Lives in one component so the
// dashboard, editor header, and any future surfaces all agree on the visual
// treatment. Spans, not divs, so it can sit inside a paragraph.
export function ConferenceStatusBadge({
  status,
  start_date,
  end_date,
  showPulse = true,
}: Props) {
  const lifecycle = getConferenceLifecycleStatus({ status, start_date, end_date })
  if (lifecycle === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full bg-success ${showPulse ? 'animate-status-pulse' : ''}`}
        />
        Live
      </span>
    )
  }
  if (lifecycle === 'past') {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        Past
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground" />
      Draft
    </span>
  )
}

export type { ConferenceLite }
