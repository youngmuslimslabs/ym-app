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

**Writes (Part 1):** reuse existing targeted saves — `saveStep1` (personal), `saveStep2` (location/membership), + a lightweight `role_assignments` insert (role_type_id, is_active=true, start_date null). Completion → `onboarding_completed_at = now()` (`completeOnboarding`). *(Open: reuse step-saves vs a slim dedicated Part-1 save — see §6.)*

---

## 3. Part 2 — profile completion (deferred, gated) spec

**Entry:** gate notice (any action button while incomplete) OR the slim strip → **full-screen completion hub**.

**Hub (Menu layout):** lists the 4 remaining sections with per-section done state (from server completion, §5); tap → that section in edit mode; skip on Roles/Projects.

**Each section:** render the reused profile Section component inside `<ProfileModeProvider isEditable>`, backed by `useProfileForm` state. Field spec (required/optional/repeatable/skip) = design doc §"Field spec per section."

**Skip (Roles/Projects):** writes **no rows** (design decision). "I haven't done any" resolves the section.

**Save:** one `saveProfile` call (covers all areas, preserves IDs). **Add:** flip `users.profile_completed_at = now()` when all sections resolved (filled or skipped). *(`saveProfile` does not touch completion flags today — extend it or call alongside.)*

---

## 4. Shared edits required (single edits, NOT forks — they propagate to all callers)

These change the shared component once; every caller (profile edit, read-only, Part 2) inherits it. **Each needs a yes:**

1. **Contribution tags replace the description textareas.** Swap the `Textarea` "What did you do?" for a new `TagChipSelector` in `YMRolesSection.tsx` (`role.description` → `role_assignments.notes`) and `YMProjectsSection.tsx` (`user_projects.description`). **This also changes the `/profile` edit experience** to tags. Confirm that's desired (recommended — consistency).
2. **New generic `TagChipSelector({options, selected, onToggle})`** — extract the chip toggle UI from `SkillsChipSelector` (currently coupled to a section header + `ProfileModeContext`). Reuse for both skills and the new contribution tags.

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

## 8. Open decisions (need owner)

1. **Tags on `/profile` too** (§4.1) — OK to change the profile edit description fields to tag chips app-wide? (recommended)
2. **Part 1 replaces the current 7-step onboarding** entirely — confirm we retire the existing wizard, not run both.
3. **Gate rebuild** — confirm the demo bottom-sheet gate is replaced by notice→full-screen (per design). *(Already decided in design doc; restating because demo code exists.)*
4. **Part-1 write path** (§2) — reuse existing `saveStep1/2` or a slim dedicated Part-1 save.
5. Carry-overs from design doc: convention check-in-only exception; `profile_completed_at` migration coordination with geography seed.
