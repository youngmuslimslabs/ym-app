// Check-in / feedback timing for a single session, from one attendee's POV.
//
// Issue #53. Check-in is open for the whole session PLUS a grace tail after it
// ends; feedback opens once the session ends but only for attendees who checked
// in. Enforcement is app-layer (internal app, no meaningful bypass threat); the
// pre-existing "feedback only after session ends" RLS gate still backstops the
// timing half. See docs/plans/2026-07-11-session-checkin-grace-feedback-design.md.

/** Minutes check-in stays open after a session's end_at. Fixed constant. */
export const GRACE_MINUTES = 15
export const GRACE_MS = GRACE_MINUTES * 60_000

export interface CheckInWindow {
  /** now ∈ [start, end) */
  inProgress: boolean
  /** now ≥ end */
  ended: boolean
  /** now ∈ [end, end + grace) — ended, but check-in is still open */
  inGrace: boolean
  /** now ≥ end + grace — check-in has closed */
  graceEnded: boolean
  /** now ∈ [start, end + grace) — the full window an attendee can check in */
  checkInOpen: boolean
}

/**
 * Pure time math for one session. Durations are absolute (ms since epoch), so
 * this is timezone-agnostic — a 15-minute grace is 15 minutes regardless of the
 * conference timezone.
 */
export function getCheckInWindow(
  startAt: string,
  endAt: string,
  now: Date
): CheckInWindow {
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()
  const graceEndMs = endMs + GRACE_MS
  const nowMs = now.getTime()

  return {
    inProgress: nowMs >= startMs && nowMs < endMs,
    ended: nowMs >= endMs,
    inGrace: nowMs >= endMs && nowMs < graceEndMs,
    graceEnded: nowMs >= graceEndMs,
    checkInOpen: nowMs >= startMs && nowMs < graceEndMs,
  }
}

export interface SessionActionInput {
  startAt: string
  endAt: string
  isBreak: boolean
  signedUp: boolean
  checkedIn: boolean
  hasFeedback: boolean
  now: Date
}

/**
 * The one interactive slot to render in a session's detail body. This is the
 * six-state machine from the design, in priority order:
 *
 *   checked in + ended        → 'feedback'    (states 4 & 6)
 *   checked in + not ended     → 'checked-in'  (state 2: waiting for end)
 *   not checked in, in window  → 'check-in'    (states 1 & 3; grace=in the tail)
 *   not checked in, past grace → 'missed'      (state 5)
 *   otherwise (upcoming, break, not signed up) → 'none'
 *
 * Feedback is NOT gated on `signedUp` (matches existing behavior — being checked
 * in is proof enough). Check-in and the missed notice ARE, since only signed-up
 * attendees are offered a code field.
 */
export type SessionActionSlot =
  | { kind: 'none' }
  | { kind: 'check-in'; grace: boolean }
  | { kind: 'checked-in' }
  | { kind: 'feedback'; edit: boolean }
  | { kind: 'missed' }

export function getSessionActionSlot(input: SessionActionInput): SessionActionSlot {
  const { isBreak, signedUp, checkedIn, hasFeedback } = input
  if (isBreak) return { kind: 'none' }

  const w = getCheckInWindow(input.startAt, input.endAt, input.now)

  if (checkedIn) {
    return w.ended ? { kind: 'feedback', edit: hasFeedback } : { kind: 'checked-in' }
  }

  // Not checked in.
  if (signedUp && w.checkInOpen) return { kind: 'check-in', grace: w.inGrace }
  if (signedUp && w.graceEnded) return { kind: 'missed' }
  return { kind: 'none' }
}
