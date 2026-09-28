'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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

export interface DayGroup {
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
  const nowMs = props.now.getTime()
  const todayKey = useMemo(
    () => dayKeyFormatter(props.timezone).format(props.now),
    [props.timezone, props.now]
  )

  // The schedule follows the clock (#68). A day whose sessions have all ended
  // starts collapsed so today is what you see; tapping its header opens it.
  // Explicit toggles win over the default.
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({})
  const dayEnded = (day: DayGroup) => day.blocks.every((b) => b.endMs <= nowMs)
  const isExpanded = (day: DayGroup) => expandedOverride[day.dayKey] ?? !dayEnded(day)

  // Once, on arrival: if the conference is under way, jump to the block that's
  // on now (or next up), not the top of the first day.
  const scrolledToNow = useRef(false)
  useEffect(() => {
    if (scrolledToNow.current) return
    scrolledToNow.current = true
    const current = currentBlockKey(days, nowMs)
    if (current) document.getElementById(current)?.scrollIntoView({ block: 'start' })
  }, [days, nowMs])

  if (days.length === 0) {
    return (
      <div className="px-6 md:px-8 py-16 text-center text-sm text-muted-foreground">
        No sessions scheduled yet.
      </div>
    )
  }

  return (
    <div className="pb-16">
      {days.map((day) => {
        const ended = dayEnded(day)
        const expanded = isExpanded(day)
        const sessionCount = day.blocks.reduce(
          (n, b) => n + b.sessions.filter((s) => !s.is_break).length,
          0
        )
        const heading = (
          <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
            {day.dayKey === todayKey && (
              <>
                <span className="text-foreground">Today ·</span>{' '}
              </>
            )}
            {day.dayLabel}
          </h2>
        )
        return (
          <section key={day.dayKey}>
            <div className="sticky top-0 z-10 bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/90 border-y">
              {ended ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOverride((prev) => ({ ...prev, [day.dayKey]: !expanded }))
                  }
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 px-6 md:px-8 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  {heading}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'} · Ended
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')}
                  />
                </button>
              ) : (
                <div className="px-6 md:px-8 py-3">{heading}</div>
              )}
            </div>

            {expanded && (
              <div className="px-6 md:px-8 pt-6 space-y-8">
                {day.blocks.map((block) => (
                  <div
                    key={`${day.dayKey}-${block.startMs}-${block.endMs}`}
                    id={blockDomId(block)}
                    // Clears the sticky day header when jumped to.
                    className="scroll-mt-16"
                  >
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
            )}
          </section>
        )
      })}
    </div>
  )
}

// ---------- helpers ----------

function dayKeyFormatter(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function blockDomId(block: TimeBlock) {
  return `schedule-block-${block.startMs}-${block.endMs}`
}

/**
 * The block to land on when the page opens: the first one that hasn't ended.
 * Null before the conference starts (the top is already right) and after it
 * ends (nothing is current).
 */
export function currentBlockKey(days: DayGroup[], nowMs: number): string | null {
  const blocks = days.flatMap((d) => d.blocks)
  if (blocks.length === 0 || nowMs < blocks[0].startMs) return null
  const current = blocks.find((b) => b.endMs > nowMs)
  return current ? blockDomId(current) : null
}

export function groupSessions(sessions: Session[], timezone: string): DayGroup[] {
  // Bucket by day-key (YYYY-MM-DD in conference timezone), then by (start, end) tuple.
  const dayMap = new Map<string, Map<string, TimeBlock>>()

  const dayKeyFmt = dayKeyFormatter(timezone)
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
