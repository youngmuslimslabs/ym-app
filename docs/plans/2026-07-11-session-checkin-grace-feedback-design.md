# Session Check-in Grace Period + Feedback Gating

**Issue:** [#53](https://github.com/youngmuslimslabs/ym-app/issues/53) — Conferences: Add a check-in grace period
**Date:** 2026-07-11
**Branch:** `feature/session-checkin-grace-feedback`

## Problem

Attendees enter a per-session check-in code to register attendance, then leave feedback
(rating 1–5 + comment). We need:

1. A **15-minute grace period** after a session ends during which check-in stays open.
2. Feedback that only becomes enterable **once the session has ended**.
3. A hard ordering rule: an attendee **must check in before they can submit feedback**.

## Existing model (already built — this is a delta, not greenfield)

- `session_check_ins` (session_id, user_id, checked_in_at), unique per (session, user).
- `check_in_to_session(p_session_id, p_code)` RPC — validates the code case-insensitively,
  inserts `ON CONFLICT DO NOTHING`. **Today it has no time window.**
- `session_feedback` (rating, comment), unique per (session, user).
- RLS policy *"Insert feedback after session ends"* already requires `sessions.end_at < now()`.
- Attendee UI: `CheckInDialog.tsx`, `FeedbackForm.tsx`, `SessionCard`, `SessionSheet`.

## Decisions (confirmed with product owner)

1. **Check-in window = `[start_at, end_at + 15min]`.** Check-in is open for the *entire
   session* plus a 15-minute tail. Gating is **upper-bound only** (`now() <= end_at + 15min`) —
   the practical lower bound is session start; no strict lower-bound check, to avoid clock-skew
   and early-code-reveal rejections.
2. **No check-in → no feedback.** For a session that has a check-in code, an attendee who never
   checks in within the window can't submit feedback. Feedback is a verified-attendance signal.
   (Uncoded sessions are exempt.)
3. **Grace period is a fixed 15-minute constant** (`GRACE_MINUTES = 15`), not per-conference
   configurable.
4. **Enforcement is app-layer, not database.** This is an internal @youngmuslims.com convention
   app; the only actor app-layer gating fails against is someone hand-crafting authenticated API
   calls to fake their *own* attendance/feedback — a nonexistent threat with zero payoff. A DB
   migration (RPC window gate + feedback RLS dependency) was drafted and deliberately dropped as
   cost-without-benefit here. **Note:** the pre-existing "feedback only after session ends" *is*
   already enforced in RLS and stays — so feedback-before-end remains hard-blocked regardless.
   If real external users / attendance incentives ever appear, re-add the DB gates then.

## The pattern: derive state on the client, gate the affordances

All three rules become client-side checks over data the attendee page already loads
(`end_at`, whether a `session_check_ins` row exists, whether a `session_feedback` row exists).
A shared `lib/checkInWindow.ts` computes the per-attendee session state; the components render
the matching affordance.

### UI composition

Friendly gate in front, RLS as backstop — **never lead with an RLS violation** (opaque
Postgres error). The client renders the feedback affordance only when it already knows a
check-in row exists (`session_check_ins` is in the realtime publication).

Per-attendee state machine for a **coded** session:

|                 | During `[start, end)`               | Grace `[end, end+15]`                    | Closed `(> end+15)`            |
| --------------- | ----------------------------------- | ---------------------------------------- | ----------------------------- |
| **Not checked in** | "Check in" (feedback hidden)     | "Check in" (last chance + countdown)     | "Check-in closed" — no feedback |
| **Checked in**     | "✓ Checked in — feedback opens at end" | "Give feedback" (same-motion if just now) | "Give feedback" (open forever) |

- Feedback CTA appears at **`max(end_at, your-check-in-time)`**.
- Check in mid-session → CTA flips to feedback **when the session ends**.
- Check in during the grace tail → session already ended, so the `CheckInDialog` swaps the code
  field for `FeedbackForm` **in the same motion**.
- `end+15` only affects attendees who never checked in (closes their door).

## Out of scope / YAGNI

- Per-conference configurable grace period.
- Upper time bound on feedback (stays open indefinitely once earned).
- Any change to uncoded-session or break behavior beyond the `IS NULL` exemption.

## Build sequence (app-layer only — no remote change)

1. `lib/checkInWindow.ts` — `GRACE_MINUTES = 15` + a pure `deriveSessionActionState(...)`
   returning the per-attendee state (the six-cell table above), with unit tests.
2. UI: `CheckInDialog` (window-closed state + same-motion feedback swap), `SessionCard` /
   `SessionSheet` affordance derivation, the "checked in, waiting for end" state.
3. Component tests for the six states.
