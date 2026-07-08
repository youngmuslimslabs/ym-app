# Two-Part Onboarding + Profile-Completion Gating — Design

**Date:** 2026-07-07
**Branch:** `feature/onboarding-ideation`
**Status:** Design agreed with owner. Field spec + this doc are the source of truth for build.
**Prototype:** `prototypes/onboarding-gating.html` (feel reference only — not the spec).

---

## Problem

The current single 7-step onboarding is too long for first-time mobile users at the convention (~2026-07-14) and risks mid-flow abandonment → unplaced members / incomplete data (only ~8 memberships exist today). We split it so people get in fast, then complete the rich data later, motivated by feature gating.

## The model

Onboarding becomes **two parts**:

- **Part 1 — mandatory, Typeform-style (one question per screen, auto-advance).** The minimum to place someone and put them in the directory. Sets `onboarding_completed_at` → user enters the app.
- **Part 2 — deferred, feature-gated, full-fidelity forms.** The rich history. Sets `profile_completed_at` → gates lift.

---

## Part 1 — fields (mandatory)

One value per screen, tap-to-pick auto-advances, text fields need "Continue":

1. Phone
2. Personal email
3. Ethnicity (single-select)
4. Date of birth
5. Location: subregion → NeighborNet (dependent)
6. **Current role** — single title select only (no dates/manager/history). Seeds one active `role_assignments` row that Part 2 later enriches.

Writes: `users` (phone, personal_email, ethnicity, date_of_birth), `memberships` (neighbor_net_id), one lightweight active `role_assignments` (role_type_id, is_active, start_date null). Completion → `onboarding_completed_at = now()`.

**Part 1 stays exactly this minimal.** Current role stays (one tap, seeds the directory).

---

## Part 2 — the six "sections" & completion

Completion is tracked across 6 sections: `personal`, `location`, `roles`, `projects`, `education`, `skills`. Part 1 completes `personal` + `location`. Part 2 covers the remaining four.

### Decisions (owner-confirmed 2026-07-07)

1. **Gate depth = WHOLE PROFILE.** A gated action requires *all* of Part 2 done (or skipped where allowed) before it proceeds.
2. **Gate trigger = uniform** — no per-feature map. Strip on every page; while `profile_completed_at` is null, tapping *any action button* on any page pops the completion notice. Navigation/browsing always free. (One time-boxed convention exception — see below.)
3. **Completion layout = MENU (hub).** Overview of remaining sections; tap in any order; progress saves as you go. (No Linear variant.)
4. **Required scope = lean.** Part 1 minimal. **Roles and Projects are skippable** ("I haven't done any YM roles/projects" is a first-class choice), since a user may genuinely have none.
5. **Signal = `profile_completed_at`.** Fires only when every section is resolved — *resolved* meaning filled OR (for Roles/Projects) explicitly skipped.

### Field spec per section (source of truth — mirror `onboarding.ts` / real section components)

**Roles** (`role_assignments`) — repeatable, **skippable**
- Role type — *required* (searchable combobox w/ custom)
- Amir/Manager — optional (combobox w/ custom)
- Start month + year — *required*; "I currently hold this role" toggle hides End; End month+year optional
- Contribution tags — optional multi-select chips (replaces the old free-text "What did you do?")
- "+ Add another role"; **"I haven't held any YM roles" → skips section (counts as resolved)**
- Valid = every entry has role + start (month & year), OR skipped.

**Projects** (`user_projects`) — repeatable, **skippable**
- Project type — *required*
- Your role — optional (text)
- Amir/Manager — optional
- Start month+year — *required*; "currently on this project" toggle; End optional
- Contribution tags — optional
- "+ Add another project"; **"I haven't worked on any YM projects" → skips (counts as resolved)**
- Valid = every entry has type + start, OR skipped.

**Education** (`users.education_level` + `users.education` JSON) — conditional, not skippable
- Education level — *required* (in high school / HS graduate / in or completed college)
- If **college**: repeatable entries, each — School *(required)*, Degree *(required)*, Field of study *(required)*, Graduation year *(required)*
- Valid = level set AND (not college OR ≥1 valid college entry). (Real rule uses `.some()`.)

**Skills** (`users.skills`) — not skippable
- Multi-select chips, **≥3 required**.

> Note: Education & Skills are **not** skippable (everyone has an education level; ≥3 skills is a low bar). Only Roles/Projects can be skipped, because org history can legitimately be empty.

---

## Gate trigger (#2) — uniform

No per-feature gate map. One rule everywhere:

- The **slim strip** sits at the top of every app page.
- While `profile_completed_at` is null, tapping **any action button** (Check in, RSVP/save, Contact a member, Submit a reimbursement, etc.) pops the completion **notice** → full-screen Menu completion → returns and continues the action.
- **Navigation & browsing are always free** — moving between pages, opening a member profile, reading the schedule/docs never gate. Only *action* buttons do (otherwise an incomplete user is trapped).

**Convention-week exception (~2026-07-14, time-boxed):** during the event, **check-in is ungated** to avoid lines at the door. *Open: also ungate RSVP/save during the event, or keep check-in the only carve-out?* Outside the event, everything is uniform.

---

## Gate UX (interaction)

`tap gated action → notice → full-screen completion (Menu) → return to the action`

1. **Notice** — a brief centered dialog (NOT a form): "Complete your profile to {action}", benefit line, **Complete my profile** / **Not now**. Consent moment only.
2. **Full-screen completion (Menu)** — hub of remaining sections with progress; tap in to fill; skippable Roles/Projects; saves as you go. This is the "room" where the real forms live — never crammed into a sheet.
3. **Return** — on reaching `profile_completed_at`, close and auto-continue the original action ("Profile complete — you're checked in / RSVP'd").

**Persistent prompt** = the **slim strip** (`UserRoundPen` icon), always at top of app pages while incomplete: "Finish setting up your profile — N of 6 sections done — X%". Retires to a quiet "Profile complete ✓" at 100%. (Card & avatar-ring variants were dropped.)

---

## Data / state model

- `users.onboarding_completed_at` — **now means Part 1 done** (semantics narrowed). Middleware still redirects null → `/onboarding`.
- **NEW `users.profile_completed_at`** (timestamptz, nullable) — set when all 6 sections resolved (filled or skipped-where-allowed). Feature gates check this.
- Roles/Projects "skipped" state needs a representation (e.g. a per-user boolean/flag or treating "resolved with zero entries + explicit skip" as done) so an empty roles list can be distinguished from "not yet answered." **Open implementation detail — decide during build** (candidate: `users.roles_skipped` / `projects_skipped` booleans, or a `profile_sections_resolved` set).

---

## Design principles carried through

- Replace "type something" with "pick something" everywhere possible.
- Open textareas → contribution tag chips + optional one-liner.
- Single-select picks auto-advance (~420ms; instant under reduced-motion).
- Mobile-first; sticky CTAs; required fields marked, Save disabled until valid (mirrors live validation).

---

## Open items to confirm / decide at build

1. Convention-week: confirm RSVP/save is ungated during the event (not just check-in).
2. Representation of "skipped" Roles/Projects in the schema (see Data model).
3. Migration for `profile_completed_at` — coordinate number (geography seed also in flight; use `ym-db-changes` skill / consolidated baseline).
4. How gates read completion in client components (`useAuth()` gives auth user only — needs the profile row / a `ProfileCompletionContext` fed from a server component).

## Not doing (YAGNI)

- Linear completion layout (Menu chosen).
- Per-action / progressive gating (whole-profile chosen).
- Persistent card / avatar-ring prompt variants (slim strip chosen).
- localStorage resume (cut earlier).

---

## Next steps

1. Owner confirms open items 1–2 above.
2. Update prototype: add "I haven't done any" skip to Roles/Projects; drop the Linear toggle (Menu only). *(Optional — feel is already validated.)*
3. Build for real: `profile_completed_at` migration → `ProfileCompletionContext` + slim strip + gate notice + full-screen Menu completion wired into Home/People/Finance/Convention. Tests per repo coverage rules (deferred during prototype; required for the real build).
