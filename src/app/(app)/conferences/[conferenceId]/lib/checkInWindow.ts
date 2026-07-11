// Check-in / feedback timing for a single session, from one attendee's POV.
//
// Issue #53. Check-in is open for the whole session PLUS a grace tail after it
// ends; feedback opens once the session ends but only for attendees who checked
// in. Enforcement is app-layer (internal app, no meaningful bypass threat); the
// pre-existing "feedback only after session ends" RLS gate still backstops the
// timing half. See docs/plans/2026-07-11-session-checkin-grace-feedback-design.md.

/**
 * Minutes check-in (and RSVP) stay open after a session's end_at. Mirrored
 * server-side as `interval '15 minutes'` in signup_for_session/cancel_signup
 * (supabase/migrations/00022_grace_tail_rsvp.sql) — change both together.
 */
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
  /**
   * now < end + grace — RSVP is still allowed. Derived from the same comparison
   * as graceEnded/checkInOpen so a walk-in can always sign-up-then-check-in
   * during the grace tail; changing GRACE_MINUTES moves both windows together.
   */
  signUpOpen: boolean
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
  // Single close-of-window comparison; every "still open" flag is derived from
  // it so the check-in and RSVP windows can never drift apart.
  const graceEnded = nowMs >= graceEndMs

  return {
    inProgress: nowMs >= startMs && nowMs < endMs,
    ended: nowMs >= endMs,
    inGrace: nowMs >= endMs && !graceEnded,
    graceEnded,
    checkInOpen: nowMs >= startMs && !graceEnded,
    signUpOpen: !graceEnded,
  }
}

/**
 * Whether the Sign up action should be offered. Shared by SessionCard (joinable
 * chrome) and SessionSheet (footer button) for the same reason getSessionState
 * exists: the two must never disagree about the same session.
 */
export function canSignUp(
  w: CheckInWindow,
  i: { isBreak: boolean; signedUp: boolean; full: boolean }
): boolean {
  return !i.isBreak && !i.signedUp && !i.full && w.signUpOpen
}

/**
 * Whether Remove RSVP should be offered. Removal mirrors creation — allowed
 * before start and during the grace tail (the escape hatch for a mistapped
 * grace-tail signup) — but never mid-session and never after checking in.
 * cancel_signup (migration 00022) enforces the outer bounds server-side
 * (window close + checked-in); hiding the button mid-session is UI-only,
 * per the app-layer-enforcement decision.
 */
export function canRemoveSignUp(
  w: CheckInWindow,
  i: { signedUp: boolean; checkedIn: boolean }
): boolean {
  return i.signedUp && !i.checkedIn && !w.inProgress && w.signUpOpen
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

export interface SessionState {
  window: CheckInWindow
  slot: SessionActionSlot
}

/**
 * The window and the action slot from a SINGLE window computation. Both the
 * detail sheet (chrome + body) and the card (chrome + badges) consume this, so
 * they can never disagree about a session's state and the window is parsed once.
 */
export function getSessionState(input: SessionActionInput): SessionState {
  const window = getCheckInWindow(input.startAt, input.endAt, input.now)
  return { window, slot: computeSlot(input, window) }
}

/** Convenience for callers that only need the slot (e.g. unit tests). */
export function getSessionActionSlot(input: SessionActionInput): SessionActionSlot {
  return getSessionState(input).slot
}

function computeSlot(input: SessionActionInput, w: CheckInWindow): SessionActionSlot {
  const { isBreak, signedUp, checkedIn, hasFeedback } = input
  if (isBreak) return { kind: 'none' }

  if (checkedIn) {
    if (w.ended) return { kind: 'feedback', edit: hasFeedback }
    // 'checked-in' waiting card only once the session is actually running.
    // (Check-in can't precede start in practice, but don't surface the card for
    // a not-yet-started session if it somehow does.)
    if (w.inProgress) return { kind: 'checked-in' }
    return { kind: 'none' }
  }

  // Not checked in.
  if (signedUp && w.checkInOpen) return { kind: 'check-in', grace: w.inGrace }
  if (signedUp && w.graceEnded) return { kind: 'missed' }
  return { kind: 'none' }
}
