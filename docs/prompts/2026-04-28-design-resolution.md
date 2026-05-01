# Design Resolution Prompt — Phase 1 (usability) → Phase 2 (visual + a11y)

You are continuing design quality work in this repo. The previous session generated two prioritized backlogs and your job is to work through them systematically, one item at a time, in two phases.

## Phase 1 — Usability action plan (do first)
**File:** `docs/plans/2026-04-27-design-critique-action-plan.md`
Output of an NN/g 10-heuristic evaluation. Items grouped P1 (severity 3, do first), P2 (severity 2), P3 (severity 1) with file:line citations and definitions of done.

## Phase 2 — Visual + a11y audit (do second)
**File:** `docs/plans/2026-02-16-ui-design-audit.md`
Older audit covering accessibility (Section 1) and visual design (Sections 2–3). Section 3 has 11 numbered recommendations grouped HIGH IMPACT / MEDIUM / POLISH. Item #1 (login redesign) is already marked ✅ IMPLEMENTED — skip it.

Do Phase 1 fully first. Move to Phase 2 only after Phase 1 is checked off or explicitly blocked with documented reasons.

---

## First moves

1. **Read `CLAUDE.md`** at the project root — authoritative on conventions: shadcn-first, lucide-only, design tokens, conventional commits, no AI footers, OKLCH tokens, etc.
2. **Confirm current branch** — `git branch --show-current`. The plan items reference `src/app/(app)/...` paths from the conferences route-group restructure, so the working branch must include that scaffolding. If unclear, ask the user whether to (a) cut a new branch like `feature/design-fixes` off `feature/conferences`, or (b) work on an existing branch directly.
3. **Read the full April action plan** to internalize scope.
4. **Resolve the open decision (D-1)** before any code changes — ask the user about the inline error strip in `UnsavedChangesModal.tsx:47-51`. The plan flags this as a judgment call. Don't guess.

---

## Per-item workflow

For each plan item:

1. **Verify the issue still exists** — re-read the cited file:line. Plans go stale; trust the current code if they disagree.
2. **Make the fix** matching the plan's recommendation. If the recommendation looks wrong now, pause and explain before deviating — don't silently improvise.
3. **Type-check** — `bunx tsc --noEmit`. If the change touches build output or public API, run `bun run build` too. If tests cover the area, run them.
4. **Commit** — one item per commit. Conventional style: `<type>(<scope>): <subject>` (under 70 chars). Body explains the *why* and references the plan item (e.g., "P1-1 from 2026-04-27 action plan"). NO `Co-authored-by: Claude`. NO AI-generated footers. Pass message via HEREDOC.
5. **Tick the checkbox** in the action plan markdown. Either fold the tick into the same commit (cleaner) or in a follow-up commit.

Don't batch items. Don't push without explicit user confirmation.

---

## Phase 1 execution order

The plan's "Suggested execution order" at the bottom maximizes file-overlap leverage. Follow it:

1. **D-1** decision — resolve up-front (before P1-1)
2. **P1-1** — error copy translation (adds `src/lib/errors/userMessage.ts`, replaces ~30 generic error strings)
3. **P2-3** — error fallback consolidation (same files as P1-1)
4. **P2-2** — `--success` token (small isolated change in `globals.css` + Tailwind config)
5. **P2-1** — loading-state pattern (wire `ProfilePageSkeleton`, build `OnboardingStepSkeleton`)
6. **P2-5 + P3-1** — ConfirmDialog primitive + Enter-to-confirm (do together)
7. **P2-4** — URL filter persistence on People page (biggest test surface, do last in P2)
8. **P3-2** — avatar `next/image` migration
9. **P3-3** — onboarding banner reword

---

## Phase 2 execution order

After Phase 1:

1. **Section 1 — Accessibility** — Critical → Serious → Moderate (in that order). Most carry direct fixes inline.
2. **Section 3 — HIGH IMPACT** items 2–4 (home dashboard, surface depth, secondary accent color)
3. **Section 3 — MEDIUM** items 5–8 (typography pairing, animations, avatars, role categories)
4. **Section 3 — POLISH** items 9–11 (dark mode, empty-state illustrations, branded loaders)

Visual work that *adds tokens* (e.g., secondary accent, surface depth layers) belongs in `src/app/globals.css` + `tailwind.config.js`, not per-component overrides. Token additions extend the design system.

For visual recommendations that overlap with the brand direction prototypes in `docs/prototypes/2026-04-27-brand-directions/`, treat the prototypes as *direction reference, not adoption decision*. The user has not picked a direction; do not introduce a new display font or radically new palette without explicit user confirmation. Stay within current tokens unless the user signs off on a brand direction.

---

## When to stop and ask the user

- **Open decision (D-1)** — surface up-front
- **Cited file:line no longer matches** — verify before proceeding
- **Fix requires expanding scope** to unrelated files extensively
- **You disagree with a plan recommendation** — explain reasoning, don't silently deviate
- **Build or type-check fails** after a fix — diagnose root cause; never bypass with `--no-verify`
- **Brand direction implications** — visual fixes that would commit to a brand direction need user sign-off

---

## Final summary

When done (or all remaining items are blocked):
- List commits made (`git log --oneline <base>..HEAD`)
- List items deferred + reason
- List newly discovered issues not in either plan
- Recommend next steps
- Offer to push the branch (do NOT push without explicit user OK)

---

## Constraints (CLAUDE.md highlights — read full CLAUDE.md too)

- Package manager: **Bun** (`bun install`, `bun run dev`, `bun run build`)
- Type-check: `bunx tsc --noEmit`
- Conventional commits, never include Claude as co-author or add AI footers
- Branch: `main` is integration branch; cut `feature/*` from main, merge back to main
- shadcn/ui first; lucide-react icons only; design tokens only (no `bg-amber-500` etc.)
- Sonner for toasts via `import { toast } from 'sonner'` — Toaster mounted globally at top-center
- Empty states: Lucide icon in `rounded-full bg-muted/50 p-4`, no emojis, no CTAs
- Resolve FK display names at query level (joins in `.select()`), never client-side fetch chains
- Safe writes: insert-first-then-delete, never delete-all-then-insert
- Use `.maybeSingle()` not `.single()` when 0 or >1 results possible
