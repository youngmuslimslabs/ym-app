# Conference Schedule — Staged Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the conference scheduling feature in six small stages, each independently shippable to `feature/conferences`. Stage 0 lands schema; Stage 1 builds the most-uncertain UI screen end-to-end; later stages expand horizontally.

**Architecture:** Schema-first kickoff (postgres tables, RLS, functions, realtime). Real React components become the design-system source of truth; the static prototype at `docs/prototypes/schedule-mockup.html` is read-only reference. Where this plan and the original design doc disagree, **this plan wins**.

**Tech Stack:** Next.js 15.5.7 App Router, React 19, TypeScript strict, Tailwind 3, shadcn/ui (new-york), Supabase (Postgres + Auth + Realtime + RLS), Bun, lucide-react icons.

**Source documents:**
- Original design (background reading, mostly still valid): `docs/plans/2026-04-23-conference-schedule-design.md`
- Prototype (read-only reference, do not edit): `docs/prototypes/schedule-mockup.html`
- This plan supersedes anything that conflicts.

---

## Locked decisions (do not relitigate during build)

These are settled. They affect schema or function signatures — changing them later is expensive.

### Schema-locking

1. **URL format:** UUID, not slugs. Routes are `/conferences/[conferenceId]` and `/admin/conferences/[conferenceId]`. No `slug` column.
2. **Time storage:** Use `start_at TIMESTAMPTZ` and `end_at TIMESTAMPTZ` on `sessions` (NOT `day_date DATE + start_time TIME + end_time TIME` from the original design). Derive day grouping client-side via `start_at AT TIME ZONE conference.timezone`. This makes RLS time comparisons correct across timezones.
3. **`remove_attendee(p_conference_id, p_user_id)` function** cascades: deletes their `session_signups` and `session_check_ins` and `session_feedback` for sessions in that conference, then the `conference_attendees` junction row. All in one transaction.
4. **`signup_for_session` requires published conference.** Function checks `conferences.status = 'published'` and rejects with `{success:false, error:'Conference not published'}` otherwise.
5. **Capacity reduction below current signups blocked via trigger.** `BEFORE UPDATE OF capacity ON sessions` raises EXCEPTION if `NEW.capacity < (SELECT count(*) FROM session_signups WHERE session_id = NEW.id)`.
6. **`cancel_signup(p_session_id)` function** added — supports a clean "Remove RSVP" affordance instead of forcing re-signup as the only mutation.
7. **Realtime publication includes** `session_signups` AND `session_check_ins`. Not `session_feedback`.
8. **Feedback is permanent.** No DELETE policy on `session_feedback`. Once submitted, attendee can update but not delete. RLS UPDATE allowed indefinitely (24h window in UI is a soft suggestion).
9. **No check-in attempt limit.** `check_in_to_session` simply rejects bad codes; UI does not track failures.
10. **Publish gating happens in DB,** not in a UI checklist. `publish_conference(p_id)` function rejects if zero sessions exist. No setup-checklist component.

### UI-shaping (carry through every component)

- **Vocabulary:** "Signed up" (not "Selected"). "Checked in" (not "Attended", not "Verified", not "Pending"). "Not checked in" for the negative state.
- **No `format`/session-type chip.** Title + description carry the type. No `session_type` column.
- **No conference attendee-count denominator** ("1,240 / 1,500"). Just "1,240 attendees".
- **Past conference dashboard row** shows "N invited · M attended" where M = `count(DISTINCT user_id) FROM session_check_ins JOIN sessions ON ... WHERE conference_id = X`.
- **No "Preview as attendee" button.** Cut.
- **No "Copy from past conference" button.** Cut.
- **No conference picker page.** Sidebar IS the picker (each invited conference is a nav item under the Conferences group).
- **No setup-checklist UI.** Removed.
- **Day navigation:** continuous scroll with sticky day headers. Drop `DayTabs.tsx` from the design doc. Mobile uses the same sticky-header pattern.
- **Admin tabs:** Info / Schedule / Attendees / Feedback (4 tabs). Feedback tab shows empty state until the first session has ended and received a response.
- **Feedback admin view simplified:** ranked-list of sessions (avg rating + N responses) + per-session comment-drilldown sheet. Drop summary stat cards and per-session distribution bars.
- **"Live" and "Past" status badges** are derived: `published AND now BETWEEN start_date AND end_date` → Live; `published AND end_date < today` → Past. Document in a single helper `getConferenceLifecycleStatus(c)`.
- **Sidebar:** invited conferences as named items under a "Conferences" group; admins additionally get an "Admin" group with one "Conferences" link. No active-state highlight on conference items in the left nav (matches existing app convention).
- **Icons:** lucide-react only. The prototype's `i-alert` reference is a bug; use `lucide.AlertTriangle`.
- **Time format normalization** (write into the design doc when updating it): `EEEE, MMMM d` for day headers ("Saturday, April 25"); `h:mm a` for times ("9:00 AM"); `h:mm a – h:mm a` for ranges ("9:00 AM – 10:15 AM"). One formatter, one place.

---

## Stage 0 — Schema, RLS, functions, realtime, smoke test

**Goal:** A single migration ships everything the database needs. Verifiable end-to-end via SQL alone, no UI.

**Branch:** `feature/conferences` (already current).

**Verifies:** All schema-locked decisions above are correctly encoded in DB.

### Task 0.1 — Inspect existing schema

Before writing the migration, confirm assumptions about existing tables.

**Files:** none (read-only).

**Steps:**
1. List recent migrations: `ls -la supabase/migrations/ | tail -10` — confirm latest number so the new file is `00012_conferences_feature.sql` (or next available).
2. Read schema for `users` table to confirm PK column name.
3. Read schema for `role_types` and `role_assignments` to confirm `role_category` enum exists, and that `role_assignments` has columns `user_id, role_type_id, is_active, start_date, end_date, scope_type, scope_id` (or similar).
4. Confirm Supabase RLS helper `is_authenticated()` and `get_current_user_id()` exist (used by existing migrations).
5. Note any divergence in this section of the plan as a comment.

**Expected outcome:** confirmation that the migration in Task 0.2 will compile against the existing schema. If anything is missing, fix here before proceeding.

### Task 0.2 — Write the migration

**Files:**
- Create: `supabase/migrations/00012_conferences_feature.sql`

**Single migration containing all the following sections in this order:**

1. **Enum:**
   ```sql
   CREATE TYPE conference_status AS ENUM ('draft', 'published');
   ```

2. **`conferences` table** (no `slug` column; `start_date`/`end_date` are conference-level dates):
   ```sql
   CREATE TABLE conferences (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     description TEXT,
     location TEXT,
     timezone TEXT NOT NULL DEFAULT 'America/New_York',
     start_date DATE NOT NULL,
     end_date DATE NOT NULL,
     status conference_status NOT NULL DEFAULT 'draft',
     published_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
     CHECK (end_date >= start_date),
     CHECK ((status = 'published') = (published_at IS NOT NULL))
   );
   ```

3. **One-way publish trigger:** as in original design doc lines 60–72.

4. **`conference_attendees` junction:** as in original design doc lines 74–80.

5. **`sessions` table — KEY CHANGE: TIMESTAMPTZ instead of date+time pair:**
   ```sql
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
     start_at TIMESTAMPTZ NOT NULL,
     end_at TIMESTAMPTZ NOT NULL,
     title TEXT NOT NULL,
     description TEXT,
     speaker TEXT,
     room TEXT,
     is_break BOOLEAN NOT NULL DEFAULT false,
     capacity INTEGER,
     check_in_code TEXT,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
     CHECK (end_at > start_at),
     CHECK (NOT is_break OR (capacity IS NULL AND check_in_code IS NULL)),
     CHECK (capacity IS NULL OR capacity > 0)
   );
   ```

6. **`session_signups`, `session_check_ins`, `session_feedback`:** as in original design (lines 102–127). No `day_date` references.

7. **Indexes:**
   ```sql
   CREATE INDEX idx_sessions_conference_start ON sessions(conference_id, start_at);
   CREATE INDEX idx_signups_session ON session_signups(session_id);
   CREATE INDEX idx_signups_user ON session_signups(user_id);
   CREATE INDEX idx_checkins_session ON session_check_ins(session_id);
   CREATE INDEX idx_feedback_session ON session_feedback(session_id);
   CREATE INDEX idx_conf_attendees_user ON conference_attendees(user_id);
   ```

8. **Capacity-reduction-below-signups trigger:**
   ```sql
   CREATE OR REPLACE FUNCTION enforce_capacity_floor()
   RETURNS TRIGGER AS $$
   DECLARE current_count INTEGER;
   BEGIN
     IF NEW.capacity IS NOT NULL AND (OLD.capacity IS NULL OR NEW.capacity < OLD.capacity) THEN
       SELECT count(*) INTO current_count FROM session_signups WHERE session_id = NEW.id;
       IF NEW.capacity < current_count THEN
         RAISE EXCEPTION 'Cannot reduce capacity below current signup count (%).', current_count;
       END IF;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   CREATE TRIGGER sessions_capacity_floor
     BEFORE UPDATE OF capacity ON sessions
     FOR EACH ROW EXECUTE FUNCTION enforce_capacity_floor();
   ```

9. **Updated_at trigger** for sessions and feedback:
   ```sql
   CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
   BEGIN NEW.updated_at = now(); RETURN NEW; END;
   $$ LANGUAGE plpgsql;
   CREATE TRIGGER sessions_set_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
   CREATE TRIGGER feedback_set_updated_at BEFORE UPDATE ON session_feedback FOR EACH ROW EXECUTE FUNCTION set_updated_at();
   CREATE TRIGGER conferences_set_updated_at BEFORE UPDATE ON conferences FOR EACH ROW EXECUTE FUNCTION set_updated_at();
   ```

10. **Role insert** — adds `'system'` to `role_category` enum if missing, then inserts the `event_admin` row:
    ```sql
    ALTER TYPE role_category ADD VALUE IF NOT EXISTS 'system';
    INSERT INTO role_types (name, code, category, scope_type, max_per_scope, description, sort_order)
    VALUES ('Event Admin', 'event_admin', 'system', 'national', NULL,
            'Can create and manage conferences, sessions, rosters', 100)
    ON CONFLICT (code) DO NOTHING;
    ```
    Note: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction with other statements that use the new value. If the migration runner wraps everything in a single transaction, split this into a separate migration file `00012a_role_category_system.sql` that runs first.

11. **Functions** — `is_event_admin`, `signup_for_session`, `cancel_signup`, `check_in_to_session`, `remove_attendee`, `publish_conference`. All `SECURITY DEFINER`, `SET search_path = public`. Bodies:

    - `is_event_admin(p_user_id UUID) RETURNS BOOLEAN`: as in design doc lines 158–166.
    - `signup_for_session(p_session_id UUID) RETURNS JSONB`: validate user is in `conference_attendees` for the session's conference; check `conferences.status = 'published'`; `SELECT ... FOR UPDATE` on session; check capacity; **delete any existing signup by this user for sessions in the same conference where `tstzrange(s.start_at, s.end_at) && tstzrange(target.start_at, target.end_at)`** (this replaces the original day_date+time overlap logic with a clean range overlap); insert new signup; return `{success: true, replaced_session_ids: [...]}`.
    - `cancel_signup(p_session_id UUID) RETURNS JSONB`: deletes own signup for that session if exists; returns `{success: true}`. Idempotent.
    - `check_in_to_session(p_session_id UUID, p_code TEXT) RETURNS JSONB`: fetch `check_in_code`; if null or mismatch return `{success:false, error:'Invalid code'}`; INSERT check-in (ON CONFLICT DO NOTHING); return `{success: true, alreadyCheckedIn: <true if conflict>}`.
    - `remove_attendee(p_conference_id UUID, p_user_id UUID) RETURNS JSONB`: must be admin; deletes from session_feedback, session_check_ins, session_signups WHERE session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id) AND user_id = p_user_id; deletes conference_attendees junction; returns `{success: true}`.
    - `publish_conference(p_id UUID) RETURNS JSONB`: must be admin; check session count > 0 else return `{success:false, error:'Add at least one session before publishing'}`; UPDATE conferences SET status = 'published', published_at = now() WHERE id = p_id; returns `{success: true}`.

12. **RLS policies.** Enable RLS on all new tables. Policies match original design doc §RLS table (lines 197–204) with these adjustments:
    - `session_feedback` WITH CHECK uses `end_at < NOW()` (not `day_date + end_time`).
    - No DELETE policy for `session_feedback`. Anywhere.
    - Add UPDATE policy for `session_feedback` on own rows.
    - DELETE policy for `conference_attendees` is admin-only (and prefer using `remove_attendee()` for cascade).

13. **Realtime publication:**
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE session_signups;
    ALTER PUBLICATION supabase_realtime ADD TABLE session_check_ins;
    ```

### Task 0.3 — Apply migration locally / staging

Run: `bunx supabase db push` (or whatever the project uses; confirm in `package.json` scripts).

**Expected:** all SQL applies cleanly with no errors.

If errors:
- `role_category` doesn't exist → check existing schema; the design doc assumed it does.
- `users(id)` FK fails → confirm `users` table name (not `auth.users`) by reading existing migrations.
- Function syntax error → run each function individually to isolate.

### Task 0.4 — Smoke test via SQL

**Files:**
- Create: `supabase/seed/conference-smoke-test.sql` (NEW directory; create if missing)

A single SQL script that:
1. Inserts a test conference (`status='draft'`).
2. Tries to call `publish_conference()` → expects `{success:false, error:'Add at least one session ...'}`.
3. Inserts two parallel sessions and one break.
4. Inserts an existing user (use the email `an.omar.ees@gmail.com` if it exists, or any first user) into `conference_attendees`.
5. Calls `publish_conference()` → expects `{success:true}`.
6. Calls `signup_for_session()` for the first session → `{success:true}`.
7. Calls `signup_for_session()` for the parallel session (overlapping time) → `{success:true, replaced_session_ids:[<first session id>]}`.
8. Calls `cancel_signup()` → `{success:true}`.
9. Tries to UPDATE the session capacity to 0 → expects EXCEPTION from trigger.
10. Calls `check_in_to_session()` with wrong code → `{success:false, error:'Invalid code'}`. With correct code → `{success:true, alreadyCheckedIn:false}`. Again → `{success:true, alreadyCheckedIn:true}`.
11. Tries to INSERT into `session_feedback` while session has not ended (set end_at to future) → expects RLS rejection.
12. Updates session end_at to past, INSERTs feedback → succeeds.
13. Calls `remove_attendee()` → all the user's data for that conference disappears.
14. Tries UPDATE session status from 'published' to 'draft' → expects EXCEPTION from one-way trigger.
15. Cleanup: `DELETE FROM conferences WHERE id = <test id>` → cascade removes everything.

Document expected output as comments inline. Run with: `psql "$SUPABASE_DB_URL" -f supabase/seed/conference-smoke-test.sql`.

**This script is the regression suite for Stage 0.** Commit it.

### Task 0.5 — Grant Omar the event_admin role

```sql
INSERT INTO role_assignments (user_id, role_type_id, is_active, start_date)
SELECT u.id, rt.id, true, CURRENT_DATE
FROM users u, role_types rt
WHERE u.email = 'an.omar.ees@gmail.com' AND rt.code = 'event_admin'
ON CONFLICT DO NOTHING;
```

Run this once against the dev DB. Don't commit it as a migration.

### Task 0.6 — Commit

```bash
git add supabase/migrations/00012_conferences_feature.sql supabase/seed/conference-smoke-test.sql docs/plans/2026-04-25-conference-staged-build.md
git commit -m "feat(conferences): schema, RLS, functions, smoke test"
```

---

## Stage 1 — Attendee schedule (vertical slice)

**Goal:** One real screen running against real data. Patterns established here cascade.

**Why this screen first:** highest UI uncertainty (sticky-headers vs tabs, "Signed up" vocabulary, session-card states, sheet behavior).

**Scope:**
- Route: `/conferences/[conferenceId]/page.tsx` server component, fetches conference + sessions + own signups + own check-ins + own feedback. Joins resolve speaker/room as plain fields (no FK indirection here).
- Component: `ScheduleContent.tsx` client wrapper.
- `DaySchedule.tsx` (rename from `DayTabs.tsx`): groups sessions by `start_at AT TIME ZONE conf.timezone` truncated to date; renders sticky day header + grouped time blocks.
- `SessionCard.tsx`: 8 states from prototype §10. Driven by `getSessionState(session, now, signup, checkIn, feedback)` helper.
- `SessionSheet.tsx`: shadcn Sheet, side="right" desktop, side="bottom" mobile.
- `SignupButton.tsx`: calls `signup_for_session` RPC, shows toast on `replaced_session_ids` (e.g., "Switched from X").
- `RemoveRsvpButton.tsx`: calls `cancel_signup` RPC.
- Sidebar: extend `AppSidebar.tsx` with the Conferences group.

**Out of scope for this stage:** check-in dialog, feedback form, admin views.

**Test:** as Omar, sign up to a session, switch to a parallel one, cancel. Watch the live data update.

---

## Stage 2 — Check-in dialog + feedback form

- `CheckInDialog.tsx`: 4-input pin field, calls `check_in_to_session`. Shows already-checked-in success state.
- `FeedbackForm.tsx`: 1–5 stars + textarea + UPSERT via direct table write (RLS gates the time check). Renders inside the same sheet.
- Wire `SessionCard` state machine to surface check-in CTA when `now ∈ [start_at, end_at]` and feedback CTA when `now > end_at`.

---

## Stage 3 — Admin scaffold

- `/admin/conferences/page.tsx` server-rendered dashboard (Active + Past tables). Derives Live/Draft/Past via `getConferenceLifecycleStatus`.
- `/admin/conferences/[conferenceId]/page.tsx` editor shell with 4 tabs (Info / Schedule / Attendees / Feedback).
- `ConferenceCreateDialog.tsx`: name + dates + timezone + location + description.
- `SessionEditor.tsx`: dialog with session/break mode toggle.
- `ConferenceInfoForm.tsx`: uses existing `floating-save-bar.tsx`.
- `DeleteConfirmDialog.tsx`: type-to-confirm pattern (sessions: type "delete"; conferences: type the conference name).

---

## Stage 4 — Admin attendees + invite/remove

- `AttendeePicker.tsx`: extends `PeoplePageClient` in `selectMode`. Adds a checkbox column and an action bar replacing `CopyEmailsButton`.
- "Invited" status pill via JOIN with `conference_attendees`.
- "Invite N selected" + "Invite all N filtered" actions.
- "Remove invite" calls `remove_attendee` RPC.

---

## Stage 5 — Admin roster + publish lifecycle

- `RosterSheet.tsx`: per-session signups + check-ins, search, filter tabs (All / Checked in / Not checked in).
- Realtime subscription on `session_signups` and `session_check_ins` filtered by conference.
- Publish flow: `Publish` button calls `publish_conference` RPC; success collapses tabs to icon-buttons (Schedule-as-page).

---

## Stage 6 — Admin feedback view

- `AdminFeedbackTab.tsx`: ranked list of sessions (avg rating + N responses). Empty state when no feedback yet.
- `SessionCommentsSheet.tsx`: drilldown showing all comments for one session.

---

## Polish backlog

Optional small items that don't justify their own stage. Pick up between stages or in a dedicated polish session.

- **Mobile drag-to-dismiss visual feedback.** ✅ Implemented in commit `b876856` (`feat(ui): bottom sheet drag-to-dismiss visual feedback`). Shared hook `useBottomSheetDragToDismiss` lives in `src/hooks/use-bottom-sheet-drag.ts`; applied to `SessionSheet.tsx`, `RosterSheet.tsx`, and `SessionCommentsSheet.tsx`. Sheet tracks the finger via direct DOM transform during `touchmove`, snaps back via inline transition below 60px, and on dismiss leaves the inline transform in place so Radix's exit keyframe (`slide-out-to-bottom`, no `from`) picks up from the finger's last position.
  - [ ] **Manual verification still owed (real mobile viewport / device, 375px Chrome devtools is fine):** for each of the three sheets — (a) slow downward drag tracks 1:1, (b) release < 60px eases back to `translateY(0)` over ~200ms (transition, not jump), (c) release > 60px flows from finger position into the close animation with no jump-back to 0. If a jump-back appears on dismiss, the `tailwindcss-animate` exit keyframe's `from` value isn't falling back to the underlying transform — fix is to add an inline `transform: translateY(100%)` transition before calling `onDismiss`.

---

## Handoff prompt for a remote / cloud session

To kick off Stage 0 in a fresh Claude session (laptop closed, agent running remotely or in another window), paste the following:

```
You're picking up the YM-app conference-schedule feature build.

Context:
- Repo: ym-app (Next.js 15 + Supabase + shadcn/ui + Bun)
- Current branch: feature/conferences
- Plan: docs/plans/2026-04-25-conference-staged-build.md
- Original design doc (background): docs/plans/2026-04-23-conference-schedule-design.md
- Prototype (read-only reference): docs/prototypes/schedule-mockup.html

Use superpowers:executing-plans to implement Stage 0 only (do not start Stage 1).

Stage 0 = a single migration + a smoke-test SQL script + verification. No UI changes. Follow tasks 0.1 through 0.6 in the plan exactly. Stop after committing Task 0.6 and report back what passed / failed in the smoke test.

Important constraints:
- Never include Claude as a co-author or AI footer in commits.
- Use Bun, not npm.
- Apply migrations with `bunx supabase db push`.
- Do not start Stage 1 — wait for review.
```

When you're back, review the diff + smoke-test output, then start Stage 1 with the same handoff pattern.

---

## What's intentionally NOT in this plan yet

- Detailed task breakdowns for Stages 1–6. Those become detailed once Stage 0 lands and we've felt the shape of the data layer in real code. Over-planning them now is wasted work.
- Mobile-specific admin screens (mobile attendee picker, mobile session editor). Defer until after Stage 5; only mobile roster is in scope per prototype §18.
- Any sched.com data import. Cut.
