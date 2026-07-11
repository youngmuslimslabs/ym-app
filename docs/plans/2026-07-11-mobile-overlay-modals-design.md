# Mobile overlay modals — design

**Date:** 2026-07-11
**Branch:** `fix/mobile-overlay-modals`
**Issues:** [#59](https://github.com/youngmuslimslabs/ym-app/issues/59), [#51](https://github.com/youngmuslimslabs/ym-app/issues/51), [#63](https://github.com/youngmuslimslabs/ym-app/issues/63)

## Problem

Three mobile bugs, one root cause. Every affected overlay is a Radix primitive
*anchored to its trigger* (`@radix-ui/react-select`, `@radix-ui/react-popover`).
On a 329–393px viewport the anchor + collision math produces clipped, off-screen,
or scroll-locked overlays.

| Issue | Widget | Shared component | Mobile fix |
|-------|--------|------------------|------------|
| #59 | onboarding roles dropdown (`SelectStep`) | Radix `<Select>` | centered modal |
| #51 | DOB date picker (`DateStep`) | `DatePicker` (Popover + Calendar) | centered modal |
| #63 | profile project role type | `SearchableCombobox` (Popover + Command) | bottom sheet |

Fixing each shared component fixes more than its issue:
- `<Select>` fix also cures the **subregion** and **neighbornet** onboarding steps.
- `SearchableCombobox` fix also improves the onboarding **nationality/ethnicity** combobox.
- `DatePicker` fix also helps conference date pickers.

## Approach

Hybrid, gated on the existing `useIsMobile()` hook (`max-width: 767px`):

- **Bottom sheet** for the searchable combobox — it is the *only* overlay with a
  text input, so the keyboard matters. A bottom-anchored sheet rides above the
  keyboard automatically.
- **Centered modal** (`Dialog`) for the tap-only Select and Calendar — no keyboard,
  centering just removes the collision problem.

**Desktop is unchanged.** All new behavior is additive: `if (isMobile) return <MobileVariant/>`
with the existing code as the untouched desktop path. `useIsMobile()` is `false`
on the server and first paint; the overlays are closed at hydration, so the branch
only matters post-interaction — no hydration mismatch, no flash.

No new dependencies: reuse `Sheet` (`side="bottom"` variant already exists),
`Dialog`, and `useIsMobile()`.

## Component designs

### 1. `SearchableCombobox` (#63) — bottom sheet on mobile
- Desktop: unchanged (Popover + Command).
- Mobile: same `Command` inside `<Sheet side="bottom">`, `max-h-[85dvh]`,
  `CommandInput` pinned top, `CommandList` scrolls below. `dvh` sizing + bottom
  anchor keep search + top results above the keyboard. No component shrinking.

### 2. `DatePicker` (#51) — centered modal on mobile
- Desktop: unchanged (Popover + Calendar).
- Mobile: `Calendar` inside a centered `<Dialog>`, `max-w-[calc(100vw-2rem)]` so it
  never clips on a 329px viewport. Tap-only.

### 3. `ResponsiveSelect` (#59) — new wrapper, centered modal on mobile
Radix Select's positioning is baked into its `Content`, so "center it" isn't a prop.
New wrapper:
- Desktop: renders the existing Radix `<Select>` composition **byte-for-byte** (same
  trigger/content/classes) — preserved so nothing changes at ≥768px.
- Mobile: a `SelectTrigger`-styled button + centered `<Dialog>` with a tappable
  option list.
- Swap `SelectStep` to use it (fixes #59 + subregion + neighbornet). Reusable for
  the other form selects (admin conferences, profile "level") later — out of scope
  for this PR.

## Data sub-task (#51 acceptance criteria)

"Remove or fix Shaheer Ghazenfer's DOB" — a one-row DB correction, separate from the
UI, done via the `ym-db-changes` skill.

## Testing & delivery

- Vitest per component: assert desktop path unchanged (mocking `useIsMobile()` →
  false) and mobile path renders the sheet/dialog variant (→ true).
- Real-device checks at 329 / 375 / 393 / 430px.
- Feature branch → PR (never direct to main). Update `docs/project-todos.md`.

## Out of scope

- Other raw `<Select>` usages (admin conference dialogs, profile "level").
- Any desktop visual change.
