'use client'

import { useMemo } from 'react'
import { SessionCard } from './SessionCard'
import type { Session } from '../types'

interface Props {
  sessions: Session[]
  signupCounts: Record<string, number>
  mySignupSessionIds: Set<string>
  myCheckInSessionIds: Set<string>
  myFeedback: Record<string, { rating: number; comment: string | null }>
  timezone: string
  now: Date
  onSelectSession: (sessionId: string) => void
}

interface DayGroup {
  dayKey: string // YYYY-MM-DD in conference timezone (used for ordering / sticky headers)
  dayLabel: string // "Saturday, April 25"
  blocks: TimeBlock[]
}

interface TimeBlock {
  startLabel: string // "9:00 AM"
  endLabel: string // "10:15 AM"
  startMs: number
  endMs: number
  sessions: Session[]
}

export function DaySchedule(props: Props) {
  const days = useMemo<DayGroup[]>(
    () => groupSessions(props.sessions, props.timezone),
    [props.sessions, props.timezone]
  )

  if (days.length === 0) {
    return (
      <div className="px-6 md:px-8 py-16 text-center text-sm text-muted-foreground">
        No sessions scheduled yet.
      </div>
    )
  }

  return (
    <div className="pb-16">
      {days.map((day) => (
        <section key={day.dayKey}>
          <div className="sticky top-0 z-10 px-6 md:px-8 py-3 bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/90 border-y">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">{day.dayLabel}</h2>
          </div>

          <div className="px-6 md:px-8 pt-6 space-y-8">
            {day.blocks.map((block) => (
              <div key={`${day.dayKey}-${block.startMs}-${block.endMs}`}>
                <div className="flex items-baseline gap-3 mb-3">
                  <div className="text-sm font-semibold tabular-nums">{block.startLabel}</div>
                  <div className="text-xs text-muted-foreground">–</div>
                  <div className="text-sm text-muted-foreground tabular-nums">{block.endLabel}</div>
                  <div className="h-px bg-border flex-1 ml-2" />
                </div>
                <div className="grid gap-3">
                  {block.sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      signedUp={props.mySignupSessionIds.has(session.id)}
                      checkedIn={props.myCheckInSessionIds.has(session.id)}
                      feedback={props.myFeedback[session.id]}
                      seatCount={props.signupCounts[session.id] ?? 0}
                      now={props.now}
                      onSelect={() => props.onSelectSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ---------- helpers ----------

function groupSessions(sessions: Session[], timezone: string): DayGroup[] {
  // Bucket by day-key (YYYY-MM-DD in conference timezone), then by (start, end) tuple.
  const dayMap = new Map<string, Map<string, TimeBlock>>()

  const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dayLabelFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  })

  for (const s of sessions) {
    const start = new Date(s.start_at)
    const end = new Date(s.end_at)
    const dayKey = dayKeyFmt.format(start)

    if (!dayMap.has(dayKey)) dayMap.set(dayKey, new Map())
    const blockMap = dayMap.get(dayKey)!

    const blockKey = `${start.getTime()}-${end.getTime()}`
    if (!blockMap.has(blockKey)) {
      blockMap.set(blockKey, {
        startLabel: timeFmt.format(start),
        endLabel: timeFmt.format(end),
        startMs: start.getTime(),
        endMs: end.getTime(),
        sessions: [],
      })
    }
    blockMap.get(blockKey)!.sessions.push(s)
  }

  // Sort: days ascending, blocks ascending by startMs.
  const days: DayGroup[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, blockMap]) => {
      const firstBlock = Array.from(blockMap.values())[0]
      const labelDate = new Date(firstBlock.startMs)
      return {
        dayKey,
        dayLabel: dayLabelFmt.format(labelDate),
        blocks: Array.from(blockMap.values()).sort((a, b) => a.startMs - b.startMs),
      }
    })

  return days
}
