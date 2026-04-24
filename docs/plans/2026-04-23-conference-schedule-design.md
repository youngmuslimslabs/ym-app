# Conference Schedule Feature — Design

## Context

YM currently uses sched.com to run its National Convention and other events, but it's glitchy and the UX is poor. This plan builds an in-app replacement that:

- Lets attendees browse a multi-day schedule, pick non-overlapping sessions, verify attendance with a password, and leave 1–5 star + comment feedback after sessions end.
- Lets admins build conferences end-to-end: sessions (each with its own time), capacities, attendance passwords, attendee invite lists, and live rosters.
- Reuses existing YM infrastructure: the People page's filterable table for attendee selection, the `role_assignments` system for admin access, and the existing server-page → client-content component pattern.
- Starts as a single upcoming National Convention but is schema-ready for concurrent / historical conferences without future migrations.

The outcome: a self-hosted, sched.com-style feature that integrates cleanly with the existing user and role data.

---

## Decisions Summary

| # | Topic | Choice |
|---|---|---|
| 1 | Scope | Multi-conference schema (`conferences` parent table); all children FK to conference. |
| 2 | Admin access | New `"Event Admin"` row in `role_types`, assigned via existing `role_assignments`. Global (not per-conference). |
| 3 | Route layout | Two siloed routes: `/schedule` (attendee), `/admin/schedule` (admin). Admin reuses attendee components as a preview pane with edit affordances overlaid. |
| 4 | Attendee assignment | Explicit invite via `conference_attendees` junction. Admin picker reuses `PeoplePageClient` in a new "select mode" with a bulk "Add filtered" action. |
| 5 | Session model | **Sessions carry their own times** (`day_date`, `start_time`, `end_time`). No `time_slots` table. Breaks are sessions with `is_break=true`, `capacity=NULL`, `attendance_password=NULL`. The attendee UI groups sessions by matching `(start_time, end_time)` at render. |
| 6 | Admin build flow | Admin adds sessions directly — no "create slot then add session" step. "Add parallel" quick-action on any grouped time copies `start_time`/`end_time` into a new session form. |
| 7 | Capacity enforcement | Postgres function `signup_for_session(session_id)` with `SELECT ... FOR UPDATE`, atomic capacity check, and automatic replacement of any existing signup for this user that **overlaps in time** on the same day. |
| 8 | Password storage | Plaintext TEXT on `sessions.attendance_password`. Low-stakes, admin-readable. |
| 9 | Feedback gate | Server-enforced via RLS `WITH CHECK`: inserts rejected before `sessions.end_time`. Client also hides form until then. |
| 10 | Realtime updates | Supabase realtime subscription on `session_signups`, filtered by `conference_id`. Updates live seat counts. Degrades cleanly to manual refetch if it flakes. |

---

## Data Model

All new tables. Naming follows existing convention (snake_case, UUID PKs via `gen_random_uuid()`, `created_at` / `updated_at` timestamptz).

```sql
CREATE TABLE conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,                       -- Free-form: "Chicago, IL" or venue name
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE conference_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (conference_id, user_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  start_time TIME NOT NULL,            -- Local to conference timezone
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,                        -- Free-text for now; could FK to users later
  room TEXT,
  is_break BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER,                    -- NULL = unlimited / break
  attendance_password TEXT,            -- Plaintext; NULL = no verification required
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (end_time > start_time),
  CHECK (NOT is_break OR (capacity IS NULL AND attendance_password IS NULL)),
  CHECK (capacity IS NULL OR capacity > 0)
);

CREATE TABLE session_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

CREATE TABLE session_attendance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

-- Indexes
CREATE INDEX idx_sessions_conference_day ON sessions(conference_id, day_date, start_time);
CREATE INDEX idx_signups_session ON session_signups(session_id);
CREATE INDEX idx_signups_user ON session_signups(user_id);
CREATE INDEX idx_conf_attendees_user ON conference_attendees(user_id);
```

### Role integration

Add a new `role_category` enum value and insert the admin role:

```sql
ALTER TYPE role_category ADD VALUE IF NOT EXISTS 'system';

INSERT INTO role_types (name, code, category, scope_type, max_per_scope, description, sort_order)
VALUES ('Event Admin', 'event_admin', 'system', 'national', NULL,
        'Can create and manage conferences, sessions, rosters', 100)
ON CONFLICT (code) DO NOTHING;
```

Admins are assigned via `INSERT INTO role_assignments (user_id, role_type_id, is_active, start_date) ...`. Revocation: `UPDATE role_assignments SET is_active = false`.

---

## Postgres Functions

All `SECURITY DEFINER`, `SET search_path = public`, matching existing pattern (`link_auth_to_user`, `get_current_user_id`).

### `is_event_admin(p_user_id UUID) RETURNS BOOLEAN`
```sql
SELECT EXISTS (
  SELECT 1 FROM role_assignments ra
  JOIN role_types rt ON ra.role_type_id = rt.id
  WHERE ra.user_id = p_user_id
    AND rt.code = 'event_admin'
    AND ra.is_active
    AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
);
```

### `signup_for_session(p_session_id UUID) RETURNS JSONB`
- Resolves current user from `get_current_user_id()`.
- `SELECT ... FOR UPDATE` on the session row to serialize concurrent signups.
- Validates: session exists, user is an attendee of the parent conference, session is not a break, not yet full.
- **Deletes any existing signup by this user that overlaps in time** on the same `day_date`:
  ```sql
  DELETE FROM session_signups ss USING sessions s
  WHERE ss.user_id = v_user_id AND ss.session_id = s.id
    AND s.conference_id = target.conference_id
    AND s.day_date = target.day_date
    AND s.start_time < target.end_time
    AND s.end_time > target.start_time;
  ```
- Inserts the new signup.
- Returns `{ success: true }` or `{ success: false, error: 'Session full' }` etc.

### `verify_session_attendance(p_session_id UUID, p_password TEXT) RETURNS JSONB`
- Fetches session's `attendance_password`.
- Compares (constant-time comparison via `pg_crypto.crypt_memcmp` or simple `=`; plaintext so direct equality is fine).
- Inserts verification row (idempotent via UNIQUE).
- Returns `{ success, error? }`.

---

## RLS Policies

Pattern matches existing `is_authenticated()` helper. New helper: `is_event_admin(get_current_user_id())` inside policies where admin bypass is needed.

| Table | Attendee read | Attendee write | Admin (via `is_event_admin`) |
|---|---|---|---|
| `conferences` | Only conferences they attend (via `conference_attendees` EXISTS) | None | Full CRUD |
| `conference_attendees` | Own row only | None | Full CRUD |
| `sessions` | Attendees of parent conference; `attendance_password` column restricted server-side (not returned in attendee reads — use explicit SELECT lists) | None | Full CRUD |
| `session_signups` | Own rows + rows of sessions they can see (for seat counts) | Only via `signup_for_session()` function | Read all, write all |
| `session_attendance_verifications` | Own rows | Only via `verify_session_attendance()` function | Read all |
| `session_feedback` | Own rows + aggregate (for admin views) | `WITH CHECK`: user matches + `(SELECT (day_date + end_time) FROM sessions WHERE id = session_id) < NOW()` | Read all |

**Password non-leak:** Attendee queries select columns explicitly, omitting `attendance_password`. Admin queries include it. Enforced in the query layer (`src/lib/supabase/queries/schedule.ts`), not by column-level RLS (which Postgres doesn't support natively per-role in the same way).

---

## Routes & Component Layout

### Attendee: `/schedule`

- `src/app/schedule/page.tsx` — Server component. Fetches user's `conference_attendees` + joined conference list.
  - No conferences → empty state.
  - One conference → render its schedule directly.
  - Multiple → render a small conference picker.
- `src/app/schedule/ScheduleContent.tsx` — Client wrapper, owns state.
- `src/app/schedule/components/`:
  - `DayTabs.tsx` — Uses shadcn `Tabs`. One tab per distinct `day_date` derived from sessions.
  - `DaySchedule.tsx` — Groups sessions by `(start_time, end_time)` tuple. Renders each group with a time header ("9:00 AM – 10:15 AM") followed by the parallel session cards beneath.
  - `SessionCard.tsx` — Shows title, speaker, room, capacity ("12 / 30 seats"), signup CTA. Disabled + muted if full and not user's selection. If `is_break`, renders as non-interactive info card with icon.
  - `SessionSheet.tsx` — shadcn `Sheet` for session details; contains signup button, attendance password entry (after session starts), feedback form (after session ends).
  - `AttendancePasswordDialog.tsx` — shadcn `Dialog` with a single `Input` + submit.
  - `FeedbackForm.tsx` — 1–5 star picker + textarea + submit; disabled until `end_time`.
- `src/app/schedule/hooks/`:
  - `useScheduleData.ts` — Initial fetch + provides refetch.
  - `useRealtimeSeatCounts.ts` — Subscribes to `session_signups` changes filtered by conference_id. Provides live per-session counts; falls back to refetch on disconnect.

### Admin: `/admin/schedule`

- `src/app/admin/schedule/page.tsx` — Server component. Guards via `isEventAdmin()`; redirects to `/schedule` if not an admin. Lists all conferences.
- `src/app/admin/schedule/[conferenceId]/page.tsx` — Server component for one conference editor.
- `src/app/admin/schedule/[conferenceId]/components/`:
  - `ConferenceEditor.tsx` — Tab navigation: Info | Schedule | Attendees.
  - `ConferenceInfoForm.tsx` — Name, description, dates, timezone, location.
  - `ScheduleBuilder.tsx` — Reuses attendee's `DayTabs` / `DaySchedule` / `SessionCard` in "admin mode" (prop: `isAdmin=true`). Admin mode adds per-row edit/delete icons; a single "+ Add session" button per day; a small "+ Add parallel" affordance below any time-grouping to pre-fill the time.
  - `SessionEditor.tsx` — Dialog for creating/editing sessions (day, start_time, end_time, title, description, speaker, room, capacity, attendance password, is_break toggle). Smart defaults: on create, `day_date` = active tab; `start_time` defaults to the `end_time` of the latest session on that day; 75-minute duration suggested.
  - `AttendeePicker.tsx` — Wraps `PeoplePageClient` in select mode (new checkbox column + `AddSelectedToConference` button replacing `CopyEmailsButton`). Exposes `filteredPeople` for a bulk "Add all filtered" action.
  - `RosterSheet.tsx` — shadcn `Sheet` per session: two tabs, "Signed Up (N)" and "Verified (M)", each a searchable list of users with name/email.

### Shared

- `src/lib/auth/isEventAdmin.ts` — Server-side check calling the RPC; single source of truth for admin gating.
- `src/lib/supabase/queries/schedule.ts` — Attendee queries (conferences by user, time_slots, sessions, signups, feedback).
- `src/lib/supabase/queries/adminSchedule.ts` — Admin queries (all conferences, rosters, CRUD mutations via direct table writes).
- `src/components/layout/AppSidebar.tsx` — Add "Schedule" nav link always; add "Admin" link conditional on `isEventAdmin`.

---

## Realtime Mechanics

- Enable replication on `session_signups` in the migration: `ALTER PUBLICATION supabase_realtime ADD TABLE session_signups;`
- `useRealtimeSeatCounts(conferenceId)`:
  ```ts
  const channel = supabase
    .channel(`signups-${conferenceId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'session_signups'
    }, (payload) => {
      // Naive: invalidate + refetch the sessions-with-counts query.
      // Smart: update a local Map<sessionId, count> based on payload.new/payload.old.
    })
    .subscribe()
  return () => supabase.removeChannel(channel)
  ```
- Cross-conference noise is filtered client-side (the subscription doesn't filter by conference natively for cross-table joins; we match the `session_id` in payload against known session IDs of this conference).

---

## Critical Files

**New:**
- `supabase/migrations/00012_schedule_feature.sql` — All new tables, enum addition, role insert, functions, RLS, realtime enable.
- `src/lib/auth/isEventAdmin.ts`
- `src/lib/supabase/queries/schedule.ts`
- `src/lib/supabase/queries/adminSchedule.ts`
- `src/app/schedule/page.tsx` + `ScheduleContent.tsx` + all components/hooks listed above.
- `src/app/admin/schedule/page.tsx` + `[conferenceId]/page.tsx` + all components.

**Modified:**
- `src/components/layout/AppSidebar.tsx` — Add nav entries.
- `src/app/people/PeoplePageClient.tsx` — Accept optional `selectMode` prop to render checkboxes + custom bulk action; default behavior unchanged. Alternative: extract a lower-level `PeopleBrowser` primitive; decide at implementation time based on how invasive the change is.

**Reused without modification:**
- `src/app/people/components/PeopleTable.tsx`, `PeopleFilters.tsx`, `PeopleSearch.tsx`
- `src/app/people/hooks/usePeopleFilters.ts`
- All shadcn primitives in `src/components/ui/`.

---

## YAGNI Cuts (intentionally out of scope)

- **Waitlists** when a session fills. User gets "Session full" and picks another.
- **Email/push notifications** for schedule changes, session reminders, etc.
- **Per-conference admin scoping** — admin is global. Schema supports future scoping via `role_assignments.scope_id` without migration.
- **Conference visibility modes** (public, opt-in, by-region). Only explicit invite list exists.
- **Session cancellation** as a separate flow — "change selection" via re-signup is the only mutation.
- **Soft deletes** — hard deletes cascade. Feedback is lost with sessions.
- **Speaker as a FK to users** — free-text for now.
- **i18n / timezone display** beyond storing the conference timezone.

---

## Verification Plan

1. **Apply migration:** `npx supabase db push` (or run the SQL file directly against the remote DB).
2. **Grant yourself admin:**
   ```sql
   INSERT INTO role_assignments (user_id, role_type_id, is_active, start_date)
   SELECT u.id, rt.id, true, CURRENT_DATE
   FROM users u, role_types rt
   WHERE u.email = 'an.omar.ees@gmail.com' AND rt.code = 'event_admin';
   ```
3. **Seed a test conference** via `/admin/schedule`: create conference, then add sessions on Day 1: one break session, two parallel sessions at 9:00-10:15 (one with capacity=1 to force the full-state UX), one session at 10:45-12:00.
4. **Invite attendees:** in the admin Attendees tab, filter People by region, bulk-add; verify `conference_attendees` rows land.
5. **Attendee flow (primary browser):** visit `/schedule`, see the conference, pick a session → seat count shows "1 / 1", card becomes "Selected". Click a different session whose time overlaps → previous signup replaced (verified in DB: no two signups for this user with overlapping time ranges on the same day).
6. **Concurrency test (second browser, different user):** Try to sign up for the capacity-1 session that's already full → sees "Session full" error from the RPC.
7. **Realtime:** In browser A, sign up for a session. In browser B (on the same page, no refresh), the seat count updates live within ~1s.
8. **Attendance verification:** After session's `start_time`, enter the password in browser A. A `session_attendance_verifications` row is created. Incorrect password returns error.
9. **Feedback gate:** Before `end_time`, try to POST feedback via curl/devtools — RLS rejects. After `end_time`, submit 1–5 stars + comment → row created. Re-submit to verify idempotency via UPSERT logic or blocked via UNIQUE (design choice: treat the UNIQUE as "update existing feedback").
10. **Admin roster:** In `/admin/schedule`, open a session's Roster sheet → see signup count + verified count, both lists populated.
11. **RLS negative test:** As a user NOT in `conference_attendees` for this conference, call `GET /rest/v1/conferences?id=eq.{id}` — returns empty.
12. **Password non-leak:** As attendee, fetch `/rest/v1/sessions` — `attendance_password` column is absent from the response (enforced by explicit column lists in `queries/schedule.ts`).

---

## Open Implementation-Time Decisions

These don't block design approval but will be resolved during build:

- **Should re-submitting feedback update or be rejected?** Recommend update (UPSERT on UNIQUE). Users change their minds.
- **Time display format** (12h vs 24h, with/without timezone suffix). Match user's locale, default 12h US.
- **Mobile layout details** for day tabs — likely a horizontal scrolling tab bar at the top.
- **Whether `PeoplePageClient` is extended in-place or a `PeopleBrowser` primitive is extracted.** Extract only if the diff against the current component exceeds ~40 lines.
