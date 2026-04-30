# YM App — Design Critique Action Plan

**Date:** 2026-04-27
**Source:** `/design-critique` single-evaluator heuristic inspection (NN/g 10 heuristics, 0–4 severity)
**Scope:** Whole app surface — sampled ~20 files across shell, profile, onboarding, conferences (user + admin), people directory
**Calibration:** Pre-launch phase, all-lenses focus, mixed audience (internal YM youth org)
**Disclaimer:** NN/g states single-evaluator severity ratings are unreliable and recommends 3–5 evaluators. Treat this as a structured starting point, not a verdict. Re-run with a fresh pass before high-stakes decisions.

---

## Audience & voice notes

This is an internal youth-org tool, not a corporate B2B product. Casual-warm-with-context copy lands well. Examples already in the codebase that hit the right note:

- "No worries — feedback isn't open without a check-in." (`SessionSheet.tsx:189-191`)
- "You're checked in" / "RSVP removed" — confirmations as a person, not a system
- The WhatsApp feedback link's pre-filled humor in `app-sidebar.tsx:142-148`

The error-copy work in **P1-1** should preserve this voice. Avoid both extremes:

- Corporate-cold: "An error occurred while processing your request"
- Over-jokey: "Yikes, the server done broke"
- Right zone: "Couldn't reach our servers — your changes are still here. Try again?"

---

## Severity scale (NN/g, verbatim)

| Rating | Meaning |
|--------|---------|
| **4** | Catastrophe — must fix before release. (None here.) |
| **3** | Major usability problem — high priority. |
| **2** | Minor usability problem — low priority. |
| **1** | Cosmetic — fix only with extra time. |
| **0** | Not a real issue. |

Severity weighs **frequency × impact × persistence**.

---

## P1 — Severity 3 (do first)

### [P1-1] Translate system-flavored errors into user-recovery copy

**Heuristic:** #9 Help users recognize, diagnose, and recover from errors
**Severity:** 3 — high frequency, medium impact, persistent

**Why it matters.** 30+ user-facing strings read like dev logs ("Failed to save profile", "Failed to fetch users", "Something went wrong"). They tell users what *the system* failed at, not what *they* should do. NN/g calls these "blame messages." This single finding accounts for the bulk of the #9 surface area.

**Where (representative, not exhaustive):**

- `src/app/profile/page.tsx:69, 104` — "Failed to save profile"
- `src/app/profile/services/profileService.ts:75, 87, 113, 140, 153, 182, 209, 225, 237, 251, 258` — "Failed to <verb> <noun>: <err.message>"
- `src/lib/supabase/queries/users.ts:34, 69`
- `src/lib/supabase/queries/profile.ts:130, 203, 243, 249`
- `src/lib/supabase/onboarding.ts:204, 268`
- `src/app/error.tsx:28-31` and `src/components/ErrorBoundary.tsx:54-58` — "Something went wrong"
- `src/components/ui/floating-save-bar.tsx:52` — default `errorMessage = 'Failed to save'`

**What to do.**

1. Add a translation utility (suggested: `src/lib/errors/userMessage.ts`) with a `toUserMessage(err: unknown, ctx?: { action: string }): string` function.
2. Map common Supabase / network failure shapes to recovery copy:
   - Network / timeout → "Couldn't reach our servers — your changes are still here. Try again?"
   - RLS denied / 403 → "You don't have access to do that. Reach out to an admin if that's not right."
   - Conflict (409 / unique violation) → context-specific (e.g., "Someone already used this email — try signing in instead.")
   - Unknown → "Something went sideways. Your work is saved — try again or reload."
3. Replace user-facing `result.error ?? 'Failed to <verb>'` patterns with `toUserMessage(err, { action: '<verb>' })`. Keep raw error strings in `console.error` for ops/Sentry.
4. Update `error.tsx`, `ErrorBoundary.tsx`, and `global-error.tsx` body copy — drop "Something went wrong" in favor of "Hit a snag rendering this page." with the existing reset/home buttons.
5. Update `FloatingSaveBar`'s default `errorMessage` to match the new voice.

**Definition of done.**

- [x] No user-facing string contains the word "Failed" (admin/internal logs are fine).
- [x] `error.tsx`, `ErrorBoundary.tsx`, `global-error.tsx` use updated copy.
- [x] All `toast.error(...)` callers either route through `toUserMessage` or supply pre-translated copy.
- [x] `FloatingSaveBar` default `errorMessage` updated.

---

## P2 — Severity 2 (pre-launch sweep)

### [P2-1] Unify loading-state pattern (skeleton everywhere)

**Heuristic:** #4 Consistency · secondary #1 Visibility
**Severity:** 2 — high frequency, low impact, persistent

**Why it matters.** Profile and onboarding use a centered `Loader2` spinner; docs / finance / people use shadcn `Skeleton`. Same product, two visual tiers of "loading."

**Where:**

- Spinners — `src/app/profile/page.tsx:167-170`, `src/app/onboarding/components/OnboardingLayout.tsx:170-176`
- Skeletons — `src/app/(app)/docs/loading.tsx`, `src/app/(app)/finance/loading.tsx`, `src/app/people/loading.tsx`
- Pre-existing-but-unused — `src/app/profile/components/ProfilePageSkeleton.tsx` (already built, just not wired in)

**What to do.**

1. In `profile/page.tsx`, replace the loading branch (lines 166-170) with `<ProfilePageSkeleton />`.
2. Build `OnboardingStepSkeleton` matching the layout (heading + form fields + nav buttons). Use it in `OnboardingLoadingState` (`OnboardingLayout.tsx:170-176`).
3. Reserve `Loader2` for inline submit-button pending state only.

**Definition of done.**

- [x] No full-page `<Loader2>` block remains in `src/app/**` (inline button spinners exempted). — `legal-lol/page.tsx:52` keeps a full-page Loader2 intentionally; it's a parody page where the loader is part of the bit.
- [x] All page-level loading uses Skeleton-shaped previews.

---

### [P2-2] Add `--success` design token; remove `text-green-600` palette literals

**Heuristic:** #4 Consistency
**Severity:** 2 — direct violation of CLAUDE.md "only design system colors"

**Why it matters.** Two places use `text-green-600` directly (FloatingSaveBar success state, CopyEmailsButton confirmation). The system already has `--destructive` but no `--success` — semantically asymmetric. Once palette literals spread, they're harder to consolidate.

**Where:**

- `src/app/globals.css` — add tokens (light + dark color schemes)
- `tailwind.config.js` — wire `success` and `success-foreground` like the existing `destructive` setup
- `src/components/ui/floating-save-bar.tsx:98-99` — replace `text-green-600` with `text-success`
- `src/app/people/components/CopyEmailsButton.tsx:41` — same

**What to do.**

1. Pick OKLCH values matching the brand. The lightness/chroma balance from `--destructive` is a reasonable starting point — the team should pick the exact green.
2. Add `--success` and `--success-foreground` for both light and dark schemes.
3. Wire in `tailwind.config.js` using the same `oklch(var(...) / <alpha-value>)` pattern as the existing tokens.
4. Replace the two callers; grep for any other `green-` palette use.

**Definition of done.**

- [x] `grep -rE "text-green-|bg-green-" src/` returns 0 results.
- [x] Both success-state callers use `text-success`.
- [x] `globals.css` has `--success` and `--success-foreground` for both light and dark.

---

### [P2-3] Consolidate duplicate error-fallback components

**Heuristic:** #4 Consistency
**Severity:** 2 — low frequency (errors only), but UI divergence is permanent until fixed

**Why it matters.** `app/error.tsx` and `ErrorBoundary.tsx` render near-identical fallback UIs. If one diverges, users see different error chrome depending on whether the error came from a route or a React render boundary.

**Where:**

- `src/app/error.tsx:14-63`
- `src/components/ErrorBoundary.tsx:40-94`

**What to do.**

1. Extract `src/components/ErrorFallbackCard.tsx` taking `{ message?, onReset, showDetails?, error? }`.
2. Have both files render `<ErrorFallbackCard ...>` with their respective context (route digest vs React errorInfo).
3. Pair with **P1-1** so the updated voice lands once, in one component.

**Definition of done.**

- [x] Both delegate UI to `ErrorFallbackCard`.
- [~] `error.tsx` and `ErrorBoundary.tsx` are <30 lines each. — `error.tsx` is 17 lines; `ErrorBoundary.tsx` is ~50 because of unavoidable React class-component boilerplate (constructor, `getDerivedStateFromError`, `componentDidCatch`, `handleReset`, `render`). The intent of P2-3 (single point of UI divergence) is met; the line target was a sketch.

---

### [P2-4] Persist People filters / search / view to URL

**Heuristic:** #6 Recognition rather than recall
**Severity:** 2 — medium frequency for power users, persistent across sessions

**Why it matters.** Filtering people down to a specific NeighborNet + role and clicking into a profile loses all filters on back navigation. The `back=` param pattern at `PersonCard.tsx:23` already preserves return URL — extending to filter state is a small step that closes the loop.

**Where:**

- `src/app/people/hooks/usePeopleFilters.ts:54` — `useState(getInitialFilters())`
- `src/app/people/PeoplePageClient.tsx:25` — `viewMode` is also state-only

**What to do.**

1. In `usePeopleFilters`, derive initial state from `useSearchParams` and write back via `router.replace` on changes (debounced for `search`).
2. Encode multi-value filters as repeated params (`?role=a&role=b`) or comma-joined strings — pick one for the project.
3. Add `?view=table|cards` for the desktop view toggle.
4. Verify the `back=` param round-trip from `PersonCard` still works.

**Definition of done.**

- [x] Filters survive a hard refresh.
- [x] Browser back from a profile restores prior filter state.
- [x] Sharing a filtered URL with a teammate reproduces the same filtered list.

---

### [P2-5] Extract a shared `ConfirmDialog` primitive (non-type-to-confirm)

**Heuristic:** #4 Consistency
**Severity:** 2

**Why it matters.** Three different ad-hoc confirm dialogs exist alongside `TypeToConfirmDialog`. They share the same icon-in-circle / title / description / footer-buttons skeleton but each is hand-rolled.

**Where:**

- Pending-swap dialog inline in `src/app/conferences/[conferenceId]/ScheduleContent.tsx:236-294`
- Remove-RSVP dialog inline in `src/app/conferences/[conferenceId]/components/SessionSheet.tsx:250-285`
- The model — `src/app/admin/conferences/components/TypeToConfirmDialog.tsx`

**What to do.**

1. Add `src/components/ui/confirm-dialog.tsx` with props:
   `{ open, onOpenChange, title, description, icon?, tone?: 'destructive' | 'primary' | 'neutral', confirmLabel, cancelLabel?, pendingLabel?, pending?, onConfirm }`.
2. Wrap the footer in a `<form onSubmit>` so Enter-to-confirm works (covers **P3-1**).
3. Replace the two inline dialogs.

**Definition of done.**

- [~] No more direct `<Dialog>` wrappers in feature components for confirm-style flows; all go through `ConfirmDialog` or `TypeToConfirmDialog`.
- [~] Enter-to-confirm works on the swap and remove-RSVP dialogs.

**Deferred 2026-04-30** — All three referenced files (`ScheduleContent.tsx`, `SessionSheet.tsx`, `TypeToConfirmDialog.tsx`) live on `feature/conferences` and aren't present on `feature/design`. The right place for this work is `feature/conferences` (or a branch cut after both merge to `main`), not here. P3-1 (Enter-to-confirm) is folded in by design and is deferred along with P2-5.

---

## P3 — Severity 1 (cosmetic; pick up with extra time)

### [P3-1] Enter-to-confirm on simple confirm dialogs

**Heuristic:** #7 Flexibility and efficiency of use
**Severity:** 1

Folded into **P2-5** — the new `ConfirmDialog` should wrap its footer in a `<form>` so Enter submits.

---

### [P3-2] Convert avatar `<img>` tags to `next/image`

**Heuristic:** Performance polish (not a strict heuristic violation)
**Severity:** 1

**Where:**

- `src/components/app-sidebar.tsx:333-337`
- `src/app/profile/page.tsx:141-146`
- `src/app/admin/conferences/[conferenceId]/components/AttendeePicker.tsx:319-323`

Preserve `referrerPolicy="no-referrer"` for Google avatars. Either configure the Google host as a `next.config` image domain, or use `unoptimized` on those specific avatars.

**Definition of done.**

- [x] All avatars use `next/image` with explicit width/height.
- [x] Google avatar URLs render correctly without referrer leakage. — `unoptimized` set on each so the Google host doesn't need to be added to `next.config.images.remotePatterns`.

---

### [P3-3] Reword onboarding background-save banner

**Heuristic:** #2 Match the real world
**Severity:** 1

**Where:** `src/app/onboarding/components/OnboardingLayout.tsx:71`

**Current:** "Step N didn't save. Your data is safe locally."

**Suggested:** "We saved your work in this browser. We'll try again automatically when you're back online."

---

## Resolved decisions

### [D-1] Inline error strip in `UnsavedChangesModal` — **RESOLVED 2026-04-28: toast (Option B)**

Originally flagged: `src/app/profile/components/UnsavedChangesModal.tsx:47-51` showed save errors as an inline destructive strip. CLAUDE.md says "never inline status strips inside Sheets/Dialogs" but also "Inline error chrome … is the right pattern for validation correction."

**Resolution:** Treat the rule as strict for save/unexpected failures, with a clean carve-out for validation correction. Save-failure errors inside dialogs route through `toast.error(toUserMessage(err))`. Validation correction (e.g., wrong check-in code) stays inline as destructive chrome around the input.

**Implication for P1-1:** Toast infrastructure (`sonner` + `<Toaster position="top-center" />`) becomes a prerequisite. `feature/conferences` already ships this setup in commit `dad3b37`; replicate the same files on `feature/design` so the diffs match when branches converge on main.

Two-line summary for future readers:
- **Validation correction → inline destructive chrome** (CheckInDialog wrong-code pattern)
- **Save failure / unexpected error → `toast.error()` at top-center**

---

## Resolved on investigation (no action needed)

These were flagged in the initial critique but cleared during follow-up. Recording so they don't get re-investigated later.

- **Onboarding URL persistence** — Each step file calls `router.push("/onboarding?step=N")` on Next/Back navigation (`step1-personal-info.tsx:102`, `step2-location.tsx:56,63`, `step3-ym-roles.tsx:90,97`, `step4-ym-projects.tsx:99,106`, `step5-education.tsx:123,130`, `step6-skills.tsx:63,70`, `step7-complete.tsx:44`). Refresh resumes at the correct step. The original concern was based on only reading `page.tsx`, not the step components.
- **`InvitedPill` dead code** — There is no `InvitedPill`. The component is `InvitedBadge` (`AttendeePicker.tsx:344`), referenced at `:147` and `:303`. Original concern was a misread.

---

## What's working — preserve, don't regress

These are project strengths the action plan should not undermine.

- **`TypeToConfirmDialog` reuse pattern** (`src/app/admin/conferences/components/TypeToConfirmDialog.tsx`) — single primitive serving destructive + primary irreversible actions via a `tone` variant. Model for **P2-5**.
- **`CheckInDialog` wrong-code recovery** (`src/app/conferences/[conferenceId]/components/CheckInDialog.tsx:130-185`) — destructive border + retained digits + copy that swaps from instruction → diagnosis → recovery hint. Reference voice for **P1-1**.
- **Pre-empt swap dialog** (`ScheduleContent.tsx:236-294`) — confirm-before-action over post-hoc toast. Behavior must be preserved when extracting `ConfirmDialog` in **P2-5**.
- **Empty-state convention** — `rounded-full bg-muted/50 p-4` icon circle used verbatim in 6 places (`AttendeePicker.tsx:410`, `admin/conferences/page.tsx:57`, `ScheduleEditor.tsx:70`, `FeedbackPlaceholder.tsx:14`, `PeopleTable.tsx:256`, `PersonCardGrid.tsx:15`). Pattern, not coincidence.
- **Token discipline** — 0 hex literals, 0 non-lucide icons, 0 arbitrary palette colors across 146 files (the two `text-green-600` instances captured in **P2-2** are the exceptions). Whatever review process produces this, keep it.
- **Audience voice** — the current casual-warm tone in conference flows ("You're checked in", "No worries — feedback isn't open without a check-in") is right for the audience. Maintain through **P1-1**.

---

## Suggested execution order

Severity and effort don't always agree. This order maximizes downstream leverage:

1. **P1-1** (error translation) — 1–2 sessions. Highest severity, sets voice for everything else.
2. **P2-3** (error fallback consolidation) — same files as P1-1, fold the new copy in once.
3. **P2-2** (success token) — small, isolated, removes a CLAUDE.md violation.
4. **P2-1** (loading state) — `ProfilePageSkeleton` already exists; quick win.
5. **P2-5 + P3-1** together (extract `ConfirmDialog`, enter-to-confirm).
6. **P2-4** (URL filter persistence) — biggest scope, highest test surface, do last in P2.
7. **P3-2, P3-3** — pre-launch polish sweep.
8. ~~**D-1** decision — resolve before or during P1-1.~~ Resolved 2026-04-28 (toast for save-failures; see Resolved decisions section).

---

## Tracking

Each `- [ ]` checkbox above is grab-able as an independent unit of work. Suggested: open a GitHub issue per priority section (P1, P2, P3) and reference this file from each.
