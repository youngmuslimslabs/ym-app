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
   session* plus a 15-minute tail. Enforcement is **upper-bound only** (`now() <= end_at + 15min`) —
   the practical lower bound is session start; no strict lower-bound check, to avoid clock-skew
   and early-code-reveal rejections.
2. **No check-in → no feedback, ever.** For a session that has a check-in code, an attendee who
   never checks in within the window can never submit feedback. Feedback is a verified-attendance
   signal. (Uncoded sessions are exempt — see predicate below.)
3. **Grace period is a fixed 15-minute constant** (`GRACE_MINUTES = 15`), not per-conference
   configurable. One SQL interval + one mirrored TS constant, cross-referenced by comment.

## The pattern: two DB predicates + one UI composition

The three rules live at the layer they belong to. Two are database predicates (single choke
point, un-bypassable); the third is pure UI.

### DB change 1 — time-gate check-in

In `check_in_to_session`, **after** looking up any existing check-in but **before** inserting a
new one:

```sql
-- If already checked in, treat as success (don't lock them out of feedback at end+16min).
-- Only apply the window gate to NEW check-ins.
if now() > (select end_at from sessions where id = p_session_id) + interval '15 minutes' then
  return json_build_object('success', false, 'error', 'checkInWindowClosed');
end if;
```

Mirror the same window as an RLS INSERT check on `session_check_ins` so a direct API call
can't bypass the RPC.

### DB change 2 — dependency-gate feedback

Extend the existing *"after session ends"* feedback RLS INSERT policy:

```sql
end_at < now()
AND (
  check_in_code IS NULL                              -- uncoded session: no check-in to require
  OR EXISTS (SELECT 1 FROM session_check_ins ci
             WHERE ci.session_id = session_feedback.session_id
               AND ci.user_id   = session_feedback.user_id)
)
```

The `check_in_code IS NULL` branch keeps feedback working for breaks / uncoded sessions.

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

## Build sequence

1. DB changes (RPC + two RLS policies) via the `ym-db-changes` skill — apply to remote, back up,
   regen types. **Pause for confirmation before touching remote.**
2. Shared `GRACE_MINUTES` constant (SQL side in the migration; TS side for the UI countdown).
3. UI: `CheckInDialog` (window-closed state + same-motion feedback swap), `SessionCard` /
   `SessionSheet` state derivation, "checked in, waiting for end" state.
4. Tests: RPC window boundary, feedback dependency gate, and the six UI states.
