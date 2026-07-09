# YM App — Manual QA Test Plan

> Re-runnable manual test script for the YM App. Walk this top-to-bottom at **both** desktop (1280×800) and mobile (393×852) viewports. Record results in a dated companion file: `docs/qa/findings-YYYY-MM-DD.md`.

## Preconditions / Setup

1. **Env:** Local dev connects to the **live shared Supabase DB** (`todqvyzdvpnwuuonxwch`). Writes are real rows. Use a **testing account** only.
2. **Start the app:**
   ```bash
   bun install
   cp .env.local .worktrees/<wt>/.env.local   # if running in a worktree
   bun run dev                                  # serves on :3000, or :3001 if taken
   ```
3. **Auth:** Google Identity Services (`signInWithIdToken`). Automated sign-in is usually blocked by Google — **log in manually once**, then reuse the session.
4. **Test account role:** Sub-Regional Secretary General, College Station · Houston (has admin surface access).
5. **Tooling:** Chrome DevTools. Watch the **Console** and **Network** panels throughout; note any `error`/`warn` and any 4xx/5xx.

## How to read this plan

- Each row is one check. Mark `PASS` / `FAIL` / `N/A` in the findings file with a short note.
- **[NEG]** = negative test (the action *should* be rejected / handled gracefully).
- **[PERF]** = latency / responsiveness observation (note perceived lag, spinner behavior, double-submit).
- **[A11Y]** = quick accessibility check (keyboard focus, labels).
- **[RESP]** = responsive/layout check — run at both viewports.

---

## 0. Global / cross-cutting

| # | Check | Expected |
|---|---|---|
| 0.1 | Load each route; watch Console | No uncaught errors, no red console output (transient first-compile chunk errors in dev are OK) |
| 0.2 | Load each route; watch Network | No unexpected 4xx/5xx; no requests to wrong Supabase project |
| 0.3 | [PERF] Click every nav item and primary button | Visible response < ~200ms; spinner/disabled state on async actions; no frozen UI |
| 0.4 | [PERF] Double-click submit buttons | Second click is a no-op (button disables during submit); no duplicate writes |
| 0.5 | [RESP] Every page at 393px and 1280px | No horizontal scroll, no clipped content, no overlapping elements |
| 0.6 | [A11Y] Tab through interactive elements | Visible focus ring; logical order; buttons reachable by keyboard |
| 0.7 | Direct-navigate to a bogus route (`/zzz-nope`) | Branded 404 with a way back (⚠️ known gap: no `not-found.tsx` yet) |
| 0.8 | Sidebar toggle (open/close) | Smooth; state persists across nav; no layout jump |

---

## 1. Auth / Login (`/login`)

| # | Check | Expected |
|---|---|---|
| 1.1 | Visit `/login` while logged out | Welcome card + "Continue with Google" button |
| 1.2 | Visit any protected route while logged out | Redirect to `/login` |
| 1.3 | [NEG] Complete Google login with a **non-@youngmuslims.com** account | Rejected (domain gate); clear message, not a crash |
| 1.4 | Log in with valid @youngmuslims.com account | Lands on `/home` (or `/onboarding` if incomplete) |
| 1.5 | Terms of Service / Privacy Policy links | Navigate to `/legal-lol` |
| 1.6 | [RESP] Login card at both viewports | Centered, legible, button full-width on mobile |

---

## 2. Onboarding (`/onboarding`)

> Only reachable when `onboarding_completed_at` is null. To retest, use a fresh account or reset the flag on the test user.

| # | Check | Expected |
|---|---|---|
| 2.1 | Step-by-step forward through all steps | Each step validates before advancing |
| 2.2 | Back button on each step | Returns to prior step, preserves entered data |
| 2.3 | [NEG] Advance with required fields empty | Blocked with inline error, no advance |
| 2.4 | [NEG] Phone field: type letters `abcxyz` | Rejected or stripped; no letters accepted |
| 2.5 | [NEG] Phone field: too-short / malformed number | Inline validation error |
| 2.6 | Region → Subregion → NeighborNet cascade | Selecting a region filters subregions; NN filtered by subregion |
| 2.7 | Role selection | System roles (e.g. Event Admin) NOT selectable |
| 2.8 | [PERF] Final "Complete" submit | Disables during save; success → `/home`; no double-submit |
| 2.9 | Interrupt a save (offline/throttle) then complete | Retry banner; completion blocked until save succeeds |
| 2.10 | [RESP] Every step at both viewports | Step indicator + form usable on mobile |

---

## 3. Home / Dashboard (`/home`)

| # | Check | Expected |
|---|---|---|
| 3.1 | Greeting + "Who you are" role/location | Matches the logged-in user's assignment |
| 3.2 | Quick Actions: People / Finance / Docs | Each navigates to the right route |
| 3.3 | "At a glance" stats (active members, neighbornets, new this week) | Numbers render; no `NaN`/`undefined` |
| 3.4 | [PERF] Click each Quick Action | Fast nav; no full reload flash |
| 3.5 | [RESP] Stat cards at 393px | Wrap cleanly, not clipped (watch the bottom stat row) |

---

## 4. People Directory (`/people`)

| # | Check | Expected |
|---|---|---|
| 4.1 | List renders members | Names, roles resolved (no raw UUIDs) |
| 4.2 | Search box: type a name | Filters list |
| 4.3 | [NEG] Search gibberish `zzzzzzz` | Graceful empty state, not a crash |
| 4.4 | [PERF] Type quickly in search | No lag/jank; debounced or smooth |
| 4.5 | Filters (role/region if present) | Narrow the list correctly |
| 4.6 | Click a person row → `/people/[id]` | Opens read-only profile |
| 4.7 | Copy-emails button (if present) | Copies; toast confirmation |
| 4.8 | [PERF] Scroll a long list | Smooth; note if it loads all rows at once (known scale gap) |
| 4.9 | [RESP] Table/list at 393px | Reflows to cards or scrolls without breaking layout |

---

## 5. Person Detail (`/people/[id]`)

| # | Check | Expected |
|---|---|---|
| 5.1 | Read-only profile renders | Roles, projects, education sections; `—` fallback for empty key fields |
| 5.2 | No edit controls | Read-only mode; no Save/Edit buttons |
| 5.3 | [NEG] Visit `/people/<bad-uuid>` | Graceful not-found, not a crash |
| 5.4 | Badges say "Current" (not "Active") | Consistent per design system |
| 5.5 | Back navigation | Returns to directory |
| 5.6 | [RESP] Sections at both viewports | Cards stack cleanly on mobile |

---

## 6. Profile (own, edit mode) (`/profile`)

| # | Check | Expected |
|---|---|---|
| 6.1 | Own profile loads in edit mode | Editable fields; existing data populated |
| 6.2 | Edit a text field + Save | Persists; toast success; value survives reload |
| 6.3 | [NEG] Phone field: letters `abc` | Rejected/stripped |
| 6.4 | [NEG] Phone field: malformed number | Inline error, save blocked |
| 6.5 | [NEG] Email field (if editable): `notanemail` | Inline validation error |
| 6.6 | [NEG] Required field cleared + Save | Blocked with inline error |
| 6.7 | Add/edit/remove a Role / Project / Education entry | Insert-first-then-delete; no data loss |
| 6.8 | [NEG] Date fields: end date before start date | Rejected or warned |
| 6.9 | [PERF] Save button | Disables during save; no double write |
| 6.10 | Discard/cancel with unsaved changes | Prompt or clean revert |
| 6.11 | [RESP] Form at both viewports | Usable on mobile |

---

## 7. Finance (`/finance`)

| # | Check | Expected |
|---|---|---|
| 7.1 | Page renders | Finance officer/dates + reimbursement content |
| 7.2 | Jotform iframe loads | Form appears (not blank/blocked) |
| 7.3 | [RESP] Jotform iframe on mobile | Not clipped; known 4000px-height risk on mobile |
| 7.4 | External/SOP links | Resolve (no link rot / 404) |

---

## 8. Docs (`/docs`)

| # | Check | Expected |
|---|---|---|
| 8.1 | Page renders | Halaqa & SOP content/links |
| 8.2 | Each link | Opens correct destination; no dead links |
| 8.3 | [RESP] Layout at both viewports | Clean |

---

## 9. Admin (`/admin`, `/admin/conferences`)

| # | Check | Expected |
|---|---|---|
| 9.1 | `/admin` reachable for this role | Renders admin landing (or correctly denies if unauthorized) |
| 9.2 | [NEG] Admin route as a non-admin user | Access denied / redirect, not exposed |
| 9.3 | Conferences list | Renders (0 conferences currently) |
| 9.4 | Create a conference | Form; saves; appears in list |
| 9.5 | [NEG] Create with empty required fields | Blocked with inline errors |
| 9.6 | [NEG] Date/time: end before start | Rejected |
| 9.7 | [NEG] Text in numeric/time fields | Rejected |
| 9.8 | Conference editor (`/admin/conferences/[id]`) | Sessions/schedule editor loads |
| 9.9 | Add / edit / delete a session | Persists; no silent data loss |
| 9.10 | [PERF] Save session | Disables during save; no double-submit; dirty-state handled |
| 9.11 | Room conflict warning | Fires only on real overlaps (watch ISO-format false positives) |
| 9.12 | [RESP] Schedule editor at 393px | `grid-cols-2` desktop layout must not break mobile |

---

## 10. Attendee Conference View (`/conferences/[id]`)

| # | Check | Expected |
|---|---|---|
| 10.1 | View a published conference as attendee | Schedule/sessions render |
| 10.2 | Check-in flow (if present) | Works with a valid code |
| 10.3 | [NEG] Forged/blank check-in code | Rejected (watch known `check_in_code` read leak) |
| 10.4 | [NEG] `/conferences/<bad-id>` | Graceful not-found |
| 10.5 | [RESP] Both viewports | Clean |

---

## 11. Legal (`/legal-lol`)

| # | Check | Expected |
|---|---|---|
| 11.1 | Page renders | Placeholder legal content (known: intentional joke page) |

---

## 12. Logout / Session

| # | Check | Expected |
|---|---|---|
| 12.1 | Log out | Returns to `/login`; session cleared |
| 12.2 | Back button after logout | Cannot re-enter protected pages from cache |
| 12.3 | Refresh while logged in | Session persists; no bounce to login |

---

## Severity rubric (for findings)

- **S1 — Blocker:** data loss, crash, security exposure, cannot complete a core flow.
- **S2 — Major:** feature broken or wrong result, but a workaround exists.
- **S3 — Minor:** cosmetic, copy, layout imperfection, non-blocking validation gap.
- **S4 — Polish/Nit:** subjective / nice-to-have.
