# YM App — Home dashboard prototypes

**Date:** 2026-04-30
**Surface:** `/home`
**Format:** Single self-contained HTML file — open in any browser, no build step
**Goal:** Layout/structure exploration *within* the locked design system. Not brand exploration.

---

## Open this

```
open index.html
```

The file shows five variants stacked vertically so you can scroll-compare:

| Variant | What it is | Cost | Resolves audit #2? |
|---|---|---|---|
| **0 — Reference** | Current production home page (centered, 2 sections) | — | (baseline) |
| **A — Stats added** | Greeting + current cards + new QuickStatsCard | ~4 commits | Yes |
| **B — Prominent, no stats** | Greeting + bigger versions of existing cards | ~2 commits | Partially |
| **C — Combined** | A + B (greeting + bigger cards + stats) | ~5 commits | Most fully |
| **D — Editorial / no cards** | Same content as A, card chrome stripped — refined typography, hairline rule, list-style actions, inline stat strip. Plus a conditional **conference attendance** section between greeting and rule (front-and-center placement) when the user is registered as an attendee. Two states (live + upcoming), distinguished only by dot pulse — no adaptive copy yet. | ~5 commits (D + conference section + query) | Yes — and addresses the "everything's a card" critique |

---

## Decisions baked in

These are settled — every variant uses them:

- **Greeting:** `Assalamu alaykum, {Name}` (Q1a) — no time/date subtitle (intentionally simple)
- **Layout:** Top-aligned with page padding (Q4b), not vertically centered
- **No new tokens / fonts / palette** — uses `globals.css` exactly as it stands after this session's `--card: 0.99 0 0` surface-depth commit
- **Geist Sans only** — every variant including D uses the existing font; "editorial" feel comes from typographic scale, weight, tracking, and spacing, not from a new display font

These remain open and are **not** in any variant:

- Category-specific tints on QuickActionCards (needs secondary accent decision — Q4/#4)
- Display font for greeting heading (Q5 typography pairing)
- "Recent activity" feed (Q2a — needs data source decision; Q2b stats card stands in)
- Generative avatars (Q7 — already deferred)

---

## How to evaluate

Standard prototype questions:

1. **First-glance** — does it feel like a destination or a navigation index?
2. **A vs D is the real fork** — "card-everywhere dashboard" (A) or "card-less editorial page" (D)? Both have the same content, the chrome is the difference.
3. **D's hover state on quick actions** — does the row hover (subtle accent tint + arrow appears) feel as good as a card hover? It's the load-bearing interaction in D.
4. **D's typography weight** — does Geist alone carry the editorial feel? If it feels too "Linear-clone" or too plain, that's a signal Q5 (typography pairing) needs to happen before D ships.
5. **Mobile** — open the file at 375px wide. D's stats strip will need a column-stack adjustment on narrow viewports.

There's no wrong answer — and you can mix. "D's editorial restraint, but with A's stats card retained" or "B's prominence with D's typographic action list" are both valid hybrids worth describing.

---

## What's next (if one resonates)

If A or B resonates clearly, I can ship it as the next batch of commits in this session.

If C resonates, same — but worth a sanity check on a 13" laptop viewport before committing, since that's the form factor where C might overflow into a scroll moment.

If D resonates: ship is ~5 commits. The conference section lands as a `ConferenceAttendanceSection` component that returns `null` when no attendance row exists. Cross-branch dependency: the `conferences` table lives on `feature/conferences` — so D's conference section is a no-op until that branch reaches `main`. Until then, D ships the section as a conditional render that never fires.

If "none of these — try X" — tell me X and I'll iterate.

---

## Conferences feature — what I learned from `feature/conferences`

The conferences feature isn't on this branch yet, so this is read-only research from `feature/conferences`. Captured here so the React implementation has a head start when conferences merges.

**Schema (migration `00013_conferences_feature.sql`):**

- `conferences` — id, name, tagline, description, location, timezone, start_date, end_date, status (`draft`/`published`)
- `conference_attendees` — junction `(conference_id, user_id)` with UNIQUE constraint. **This is the conditional**: section appears iff a row exists for the current user.
- `sessions` — per-conference timed events (start_at, end_at, title, room, capacity)
- `session_signups` — user → session, "I plan to attend"
- `session_check_ins` — user → session, "I'm physically here"
- `session_feedback` — 1–5 rating + optional comment

**Lifecycle is computed, not stored.** `lib/lifecycle.ts` derives `draft`/`live`/`past` from `status` + dates against `now`. The home card uses two of these: `upcoming` (today < start_date, derived locally — `lifecycle.ts` lumps this into `live` for admin purposes) and `live` (today in `[start, end]`). No finer slices: the schema doesn't currently model "doors open at X", "sign-ups open window", or other product-stage signals — adding adaptive copy for those should wait until the conferences feature surfaces real signal data.

**One-way publish** — once a conference is published, it can't go back to draft (DB trigger enforces). So `published_at` is a stable timestamp.

**Existing user UI:** `/conferences/[conferenceId]` already has `ScheduleContent`, `SessionCard`, `SessionSheet`, `CheckInDialog`, `FeedbackForm`. The home card's "View your schedule" link routes there.

**Implementation scope when this lands:**

```ts
// New: src/lib/supabase/queries/upcomingAttendance.ts
async function fetchUpcomingAttendance(userId: string): Promise<AttendeeView | null> {
  // Join conference_attendees → conferences, filter by:
  //   - status = 'published'
  //   - end_date >= today
  //   - start_date <= today + 30 days  (30-day window for home-card visibility)
  // Order by start_date ASC, limit 1 (most imminent only)
  // Compute display state (upcoming-far / close / today-pre / live / final-day)
  // Return null if no row, or AttendeeView with derived state
}

// New: src/components/home/ConferenceAttendanceSection.tsx
// Renders nothing if attendance is null; else renders the section with
// the right copy and dot animation per display state.
```
