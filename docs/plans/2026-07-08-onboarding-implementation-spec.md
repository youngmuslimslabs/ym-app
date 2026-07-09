# Implementation Spec — Two-Part Onboarding + Profile Completion

**Date:** 2026-07-08 · **Branch:** `feature/onboarding-ideation`
**Companion to:** `2026-07-07-two-part-onboarding-gating-design.md` (design/decisions). This doc = components, reuse, data.

---

## 0. Reuse strategy (the core principle)

Part-2 completion is "fill in your profile," so it **reuses the existing profile machinery** rather than forking:

- **Section components** (`src/app/profile/components/*Section.tsx`) — pure, prop-driven, no self-fetch of user data.
- **`useProfileForm`** (`src/app/profile/hooks/useProfileForm.ts`) — form state + all add/update/remove/toggle callbacks + change tracking. Generates client UUIDs per row.
- **`useProfileData`** (`useProfileData.ts`) — fetches the current user's profile.
- **`saveProfile`** (`src/app/profile/services/profileService.ts`) — one save covering all areas; upsert-by-id + diff-delete (preserves row IDs).
- **`ProfileModeProvider isEditable`** (`src/contexts/ProfileModeContext.tsx`) — flips sections into edit mode.

**Part-2 completion = these five, wrapped in new full-screen "hub" chrome.** No new form components for the four Part-2 areas.

---

## 1. Component reuse table (area × context)

| Area | Component (reuse) | Part 1 onboarding | Profile edit | Read-only | **Part 2 completion** |
|---|---|---|---|---|---|
| Roles | `YMRolesSection.tsx` | — | ✅ today | ✅ today | ✅ **reuse as-is** (+ tags edit, §4) |
| Projects | `YMProjectsSection.tsx` | — | ✅ | ✅ | ✅ **reuse as-is** (+ tags edit) |
| Education | `EducationSection.tsx` | — | ✅ | ✅ | ✅ **reuse as-is** (cleanest — no fetch) |
| Skills | `SkillsChipSelector.tsx` | — | ✅ | ✅ | ✅ **reuse as-is** |
| Personal | `PersonalInfoSection.tsx` | typeform screens (new) | ✅ | ✅ | done in Part 1 |
| Location | *no section exists* | `step2-location` / new typeform | — | — | done in Part 1 |

**Shared input primitives — all standalone, reuse anywhere:** `SearchableCombobox`, `DateRangeInput`, `MonthYearPicker`, `date-picker`.

---

## 2. Part 1 — onboarding (mandatory typeform) spec

New lightweight one-field-per-screen flow (replaces the current 7-step wizard). Reuses primitives, **not** the multi-field sections.

| Screen | Field | Input | Auto-advance |
|---|---|---|---|
| Welcome | — | — | "Get started" |
| Phone | `users.phone` | `Input type=tel` | Return/Enter |
| Email | `users.personal_email` | `Input type=email` | Return/Enter |
| Ethnicity | `users.ethnicity` | Select (native) | on select |
| DOB | `users.date_of_birth` | **`input type=date`** (native iOS wheel; JS-validate range) | on change |
| Subregion | (derives NN) | Select / `SearchableCombobox` | on select |
| NeighborNet | `memberships.neighbor_net_id` | Select (filtered by subregion) | on select |
| Current role | `role_assignments` (1 active row) | `SearchableCombobox` (role types) | on select |
| Done | — | — | "Enter the app" |

**Writes (Part 1):** reuse existing targeted saves — `saveStep1` (personal), `saveStep2` (location/membership), + a lightweight `role_assignments` insert (role_type_id, is_active=true, start_date null). Completion → `onboarding_completed_at = now()` (`completeOnboarding`). *(Open: reuse step-saves vs a slim dedicated Part-1 save — see §12.)*

**Navigation & auto-advance (Part 1) — follow Typeform's patterns exactly:**
- **Single-tap answers auto-advance instantly.** A select, native date pick, or combobox selection jumps to the next screen the moment it's chosen (Typeform: a single choice = advance; no OK button).
- **Typed / multi-select answers wait for Enter/OK.** Phone, email (and any multi-select) advance on **Enter/Return** — never on keystroke (that would jump mid-typing). Show Typeform's **"press Enter ↵"** affordance beside the field; on mobile the keyboard's blue **"Go/return"** key does the same job. A visible **Continue** button is always present as the explicit fallback.
- **Back on every screen** — returns to the previous screen with the entered value preserved (state held in the flow, not lost).
- Desktop keyboard: Enter = advance; Back button (or Shift+Tab to the control) = previous.
- **General rule (Typeform parity):** the interaction model, keyboard behavior, "press Enter" hint, and single-tap-advance vs Enter-to-advance split should all match Typeform — it's the pattern users already know.

---

## 3. Part 2 — profile completion (deferred, gated) spec

**Entry:** gate notice (any action button while incomplete) OR the slim strip → **full-screen completion hub**.

**Hub (Menu layout):** lists the 4 remaining sections with per-section done state (from server completion, §5); tap → that section in edit mode; skip on Roles/Projects.

**Each section:** render the reused profile Section component inside `<ProfileModeProvider isEditable>`, backed by `useProfileForm` state. Field spec (required/optional/repeatable/skip) = design doc §"Field spec per section."

**Skip (Roles/Projects):** writes **no rows** (design decision). "I haven't done any" resolves the section.

**Save:** one `saveProfile` call (covers all areas, preserves IDs). **Add:** flip `users.profile_completed_at = now()` when all sections resolved (filled or skipped). *(`saveProfile` does not touch completion flags today — extend it or call alongside.)*

---

## 4. Shared edits (owner-confirmed — single edits that propagate to all callers)

These change the shared component once; every caller (Part 2, **`/profile` edit**, read-only) inherits it. This is not a fork.

1. **Contribution tags replace the description textareas** in `YMRolesSection.tsx` (`role.description` → `role_assignments.notes`) and `YMProjectsSection.tsx` (`user_projects.description`) — **and on `/profile` too** (confirmed; consistency).
2. **One generic `TagChipSelector` powers both skills and contribution tags** — it's the *same chip component skills uses today*, extracted and decoupled from the section header + `ProfileModeContext`. `SkillsChipSelector` is refactored to consume it. Full spec in §9 (incl. the "add your own" fill-in).

---

## 5. Server-derived completion (new)

The prototype's `ProfileCompletionContext` computes completeness client-side from hardcoded presets — **demo only.** Production:
- Extend `fetchOnboardingData` / `getIncompleteStep` (`src/lib/supabase/onboarding.ts`) to return **per-section booleans + a percent**.
- Feed a production `ProfileCompletionContext` from a **server component** (client `useAuth()` gives the auth user only, not the profile row).
- Gates + strip read this single source.

---

## 6. Net-new vs demo-to-productionize

| Item | Status | Action |
|---|---|---|
| `TagChipSelector` | new | build (extract from skills chips) |
| Completion **hub** screen | truly new | build (full-screen route/component) |
| Slim completion **strip** | demo is a *card*, not our chosen strip | build the strip (design chose strip; card is a style ref; `ConferenceOnboardingBanner` is the closest template) |
| **Gate** | demo `ProfileGate` is a bottom-sheet **form** | rebuild as our final pattern: **notice → full-screen hub → return** (NOT the sheet-form) |
| `ProfileCompletionContext` | demo (presets/DevControlBar) | rewire to server completion (§5) |
| `users.profile_completed_at` | not in schema | migration via `ym-db-changes` skill |

> ⚠️ The `gating-preview/` scaffold + `src/components/profile-completion/*` + `src/contexts/ProfileCompletionContext.tsx` are **prototype/demo code** (hardcoded presets, `markComplete()` doesn't save). Treat as visual/interaction reference to extend — and note the demo diverged from final design in two places (card vs strip; sheet-form gate vs notice→full-screen).

---

## 7. Data layer summary

- **Part 1** → `saveStep1` + `saveStep2` + role insert → `onboarding_completed_at`.
- **Part 2** → `saveProfile` (all areas) → + `profile_completed_at`.
- **Do NOT** use `onboarding.ts` per-step saves for Part 2 (divergent delete-reinsert path; loses row IDs). One write path per part.

---

## 9. `TagChipSelector` spec (generic — skills + contribution tags)

One component, two callers. Decoupled from any section header / `ProfileModeContext`.
- **Props:** `{ options: string[], selected: string[], onToggle(v), allowCustom?: boolean, min?: number }`.
- **Render:** tappable `Badge`-style chips; selected = primary fill + check icon. Chips **wrap** to multiple rows — never truncate a row, never horizontal-scroll.
- **"Add your own" fill-in** (`allowCustom`, ON for contribution tags; skills stays a fixed list): a persistent **"+ Add your own"** chip → reveals an inline text input → Enter (or comma) commits it as a new selected chip. Mirrors the CLAUDE.md "SearchableCombobox always-show Add custom…" pattern.
- **Overflow / long text:** the inline input **grows with content up to the container width, then wraps**; a committed long custom chip **wraps its label (max ~2 lines)** rather than overflowing. No layout break, no horizontal scroll. Verify at 320px and desktop.
- **Reuse:** skills = `allowCustom:false, min:3`; contribution tags = `allowCustom:true`.

## 10. Field input & validation (source of truth = current onboarding, documented here)

Answer to "define specifics, or pull from onboarding, or both?" → **both.** Current onboarding is the *source of truth* for the rules; this table *records* them so nothing is lost when the wizard is retired, and so the iOS date gap is explicit.

| Field | Allowed / format | Rule source (current) | Notes |
|---|---|---|---|
| Phone | digits, auto-format `(555) 123-4567` | `isValidPhone` (step1) | required |
| Personal email | valid email | `isValidEmail` (step1) | required |
| Ethnicity | one of fixed `ETHNICITIES` list | step1 const | required |
| DOB | date, **range enforced in JS** (≥1940, ≤ today−10y) | step1 DatePicker `fromYear/toYear` | native input ignores min/max on iOS → JS-validate |
| Subregion / NeighborNet | a DB row; NN filtered by subregion | `fetchSubregions` / `fetchAllNeighborNets` | required |
| Current role | a `role_types` row (or custom) | `fetchRoleTypes` (system roles filtered) | required |
| Role / Project type | DB row / const, custom allowed | step3 / step4 combobox | required per entry |
| Start month + year | month + year | step3 / step4 validation | required per entry |
| Field of study | free text, trimmed non-empty | step5 | required if college |
| Skills | ≥3 from fixed list | step6 | min 3 |

## 11. Desktop / responsive / native mobile inputs (must work on both)

The app is a **sidebar shell on desktop** (`AppShell`), single column on mobile. Per surface:
- **Part 1 typeform** — runs *outside* the shell (full-page, like `/onboarding` today). Desktop: centered max-width column (~480px) + Enter/Back keys. Mobile: full-width.
- **Completion hub + sections** — mobile: full-screen slide-up. **Desktop: a large centered modal/dialog** (not a phone-height sheet) *or* a `/profile/complete` page inside the shell (see §12.2). Reused sections are already responsive (they run on `/profile` desktop today).
- **Gate notice** — centered dialog; identical both platforms.
- **Slim strip** — top of the content column; inside `<main>` on desktop, full-width on mobile.
- **Native date input** — desktop shows the browser date control; iOS shows the wheel.
- **Test widths:** 320 / 375 / 393 / 430 / 768 / 1280+.

**Native mobile inputs — prefer them wherever possible:**
- **Dates** → `input type=date` (DOB), `input type=month` (role/project ranges) → native iOS wheel (and native Android pickers). JS-validate ranges (iOS ignores `min`/`max`).
- **Keyboards** → `type=tel` (phone → numeric pad), `type=email` (email keyboard with @), plus correct `inputmode` / `autocomplete` so the right keyboard + autofill appear.
- **Plain single-selects** (e.g. ethnicity) → native `<select>` → iOS opens the native wheel; pairs cleanly with auto-advance on `change`.
- **Custom `SearchableCombobox` only where search / add-custom is required** (role types; NeighborNet if the list is long). Otherwise prefer the native control.
- **Principle:** native where it improves the mobile experience (date wheel, right keyboard, better a11y, less code); custom only when native can't do the job (search, tag chips). Accept native controls' limited styling.
- Desktop: the same inputs fall back to the browser's native desktop controls — fine.

## 12. Open decisions (need owner)

1. **Part-1 write path** (§2) — reuse existing `saveStep1/2` (+ role insert), or a slim dedicated Part-1 save. *(Lean: reuse step-saves.)*
2. **Completion hub on desktop** (§11) — centered modal vs a `/profile/complete` page in the shell. *(Lean: modal — keeps gate→complete→return in place on both platforms.)*
3. Carry-overs: convention check-in-only exception; `profile_completed_at` migration coordination with geography seed.

**Resolved this round:** tags = one generic chip component (same as skills) + applied on `/profile` too, with an "add your own" fill-in that wraps gracefully; retire the old 7-step wizard; gate = notice→full-screen; Part-1 auto-advance (pick = immediate, text = Enter on mobile *and* desktop) + Back on every screen; desktop is a first-class target throughout.
