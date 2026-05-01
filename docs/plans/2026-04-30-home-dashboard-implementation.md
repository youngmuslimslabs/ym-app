# Home Dashboard Implementation Plan (Variant D — Editorial)

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Replace the current centered/card-stacked home page with the editorial Variant D layout from `docs/prototypes/2026-04-30-home-dashboard/index.html` — greeting, conditional conference attendance section, identity, quick-action list, inline stats strip. No card chrome anywhere on the home page.

**Architecture:** Server-rendered home page (existing `src/app/(app)/home/page.tsx`) fetches user context + home stats in parallel via Supabase server client, then composes new presentational components. Conference section is a conditional null-renderer until `feature/conferences` lands on `main`. All styling uses existing OKLCH design tokens — no new fonts, no new palette, no new tokens.

**Tech Stack:** Next.js 15.5.7 App Router, React 19, TypeScript strict, Tailwind 3, Supabase (server-side), Bun. shadcn/ui primitives where they fit (none for the core sections — D is intentionally card-less). Lucide icons only.

---

## Working environment

- **Worktree:** `/Users/omarumbrage/Documents/Projects/ym-app/.worktrees/design`
- **Branch:** `feature/design` (already cut from `main`)
- **Reference prototype:** `docs/prototypes/2026-04-30-home-dashboard/index.html` (open this in a browser before starting; the editorial Variant D mockup is the implementation target)
- **Audit reference:** `docs/plans/2026-02-16-ui-design-audit.md` Section 3 HIGH IMPACT #2 ("Home page — make it a real dashboard")
- **Package manager:** Bun (`bun install`, `bun run dev`, `bun run build`, `bun run test`)
- **Dev server port:** typically 3000, falls back to 3002 if taken

## Decisions already made (DO NOT re-debate)

These were resolved during the design session that produced the prototype. They are non-negotiable inputs to the implementation; if implementation forces a re-decision, stop and ask.

| Decision | Resolution | Rationale |
|---|---|---|
| **Greeting style** | `Assalamu alaykum, {firstName}.` — two lines, name on its own line, period after the name | Editorial framing; aligns with Young Muslims brand identity; period gives the greeting "complete sentence" feel |
| **Greeting subtitle** | None (no time, no date) | User explicitly said "too much complexity" |
| **Layout posture** | Top-aligned (not vertically centered) | Once you add a third+ section, vertical centering reads as a placeholder/loading screen |
| **Card chrome** | Removed entirely on home page | User direct: "feels janky and not smooth and slick"; aligns with audit "everything is a card" critique |
| **Hierarchy device** | Typography size + weight + tracking + spacing; eyebrow labels (uppercase smallcaps) replace card titles | No card containment needed when type does the work |
| **Color discipline** | Grayscale typography on white; one sharp cobalt accent — on the user's name in the greeting; second cobalt accent on the conference eyebrow + action when present | Dominant + sharp accent pattern; no new tokens |
| **Conference section** | Conditional render — null when no `conference_attendees` row exists for the current user. Lives between greeting and hairline rule (most prominent slot). Two states: live (pulsing green dot) vs upcoming (static green dot). Copy is identical in both states (name + date range + action). No adaptive copy ("Day 2 of 3", "47 sessions today", etc.) — those wait for real product signals. | Schema doesn't model fine stages today; day-buckets ≠ stages |
| **Stats card** | An inline 3-stat strip (Active members / NeighborNets / New this week) — no card wrapper | Editorial vocabulary applied to data display |
| **Quick actions** | A typographic list (`QuickActionList` with `QuickActionRow` items), not separate cards. Hover state: row gets subtle accent tint, icon shifts to primary, description darkens to foreground, arrow fades in + translates 2px right | Replaces `QuickActionCard` |
| **PersonalContextCard** | Wrapper card removed; identity (role + location) renders as plain typography under a "Who you are" eyebrow | Consistent with no-card principle |
| **Animations** | Single page-load stagger (existing pattern). The conference dot's pulse is the only idle animation — intentional restraint | Pulse signal stays meaningful |
| **Brand-direction items** | DEFERRED — no new fonts, no secondary accent, no display-typography pairing. Those need a brand-direction conversation. | Out of scope for this plan |

## Cross-branch dependency: conferences

The `conferences` feature lives on `feature/conferences`, **not on `feature/design`**. There is no `conferences` table or query layer on this branch. The `ConferenceAttendanceSection` component built in Task 5 returns `null` for now — the section is invisible on the home page until `feature/conferences` merges to `main` and is then merged into `feature/design`.

When that happens, the section's TODO comment guides the next engineer to:
1. Add `fetchUpcomingAttendance(userId)` query (joins `conference_attendees` → `conferences`, filters by `today < end_date`, orders by `start_date ASC`, limits 1).
2. Compute `isLive = today >= start_date && today <= end_date` client-side.
3. Pass `attendance` and `isLive` into the section component, which renders the design from the prototype.

**Schema reference (read-only, on `feature/conferences`):**
- `supabase/migrations/00013_conferences_feature.sql` — base schema
- `supabase/migrations/00014_conferences_tagline.sql` — adds `tagline TEXT` (optional, do not surface yet)
- `src/app/(app)/admin/conferences/lib/lifecycle.ts` — derived-state helper

## Final state at end of plan

After Task 9, the home page (`/home`):
- Replaces today's centered layout with a top-aligned editorial composition (max-width ~600px, left-aligned content).
- Renders: Greeting → (Conference section, currently null) → hairline rule → Who you are → Quick actions → At a glance.
- Has zero `<Card>` primitives in the rendered DOM at `/home`.
- Compiles, type-checks, and passes all 84 existing tests + any new ones written.
- Audit doc `docs/plans/2026-02-16-ui-design-audit.md` Section 3 HIGH IMPACT #2 is ticked partial (with a note that "recent activity" was scoped to stats; brand-direction items remain open).

---

## Task 0: Setup verification

**Files:** none (verification only)

**Step 1: Confirm working tree**

Run:
```bash
cd /Users/omarumbrage/Documents/Projects/ym-app/.worktrees/design
git status
git branch --show-current
```

Expected:
- Branch: `feature/design`
- No uncommitted changes (clean working tree)

If branch is wrong or there are uncommitted changes, **STOP** and ask before proceeding.

**Step 2: Baseline tests pass**

Run: `bun run test`

Expected: `Test Files  6 passed (6)` and `Tests  84 passed (84)` (or higher — new tests may have landed). If any tests fail at baseline, **STOP** — fix or surface before adding new code.

**Step 3: Baseline typecheck passes**

Run: `bunx tsc --noEmit`

Expected: no output (clean).

**Step 4: Open the prototype**

Run: `open docs/prototypes/2026-04-30-home-dashboard/index.html`

Skim Variant D (the fourth variant — labeled "Editorial"). The implementation target is exactly this layout. The `<style>` block in the file shows the exact CSS values to translate to Tailwind classes.

**No commit for this task.**

---

## Task 1: `getFirstName` helper + test

**Files:**
- Create: `src/lib/utils/getFirstName.ts`
- Create: `src/lib/utils/getFirstName.test.ts`

**Why:** The Greeting component renders `{firstName}.` from a full name. Centralize the extraction so future surfaces (sidebar, user menu) can reuse it.

**Step 1: Write the failing test**

Create `src/lib/utils/getFirstName.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getFirstName } from './getFirstName'

describe('getFirstName', () => {
  it('returns the first space-separated token', () => {
    expect(getFirstName('Omar Anees')).toBe('Omar')
  })

  it('handles single-word names', () => {
    expect(getFirstName('Madonna')).toBe('Madonna')
  })

  it('trims surrounding whitespace', () => {
    expect(getFirstName('  Omar Anees  ')).toBe('Omar')
  })

  it('returns the fallback when input is empty', () => {
    expect(getFirstName('', 'Member')).toBe('Member')
  })

  it('returns the fallback when input is whitespace only', () => {
    expect(getFirstName('   ', 'Member')).toBe('Member')
  })

  it('defaults the fallback to "Member" when not provided', () => {
    expect(getFirstName('')).toBe('Member')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun run test src/lib/utils/getFirstName.test.ts`

Expected: FAIL — module not found (`getFirstName` doesn't exist yet).

**Step 3: Write minimal implementation**

Create `src/lib/utils/getFirstName.ts`:

```typescript
export function getFirstName(fullName: string, fallback = 'Member'): string {
  const trimmed = fullName.trim()
  if (!trimmed) return fallback
  return trimmed.split(/\s+/)[0]
}
```

**Step 4: Run test to verify it passes**

Run: `bun run test src/lib/utils/getFirstName.test.ts`

Expected: PASS — all 6 cases.

**Step 5: Run full test suite**

Run: `bun run test`

Expected: previous count + 6 = at least 90 passing.

**Step 6: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean.

**Step 7: Commit**

```bash
git add src/lib/utils/getFirstName.ts src/lib/utils/getFirstName.test.ts
git commit -m "$(cat <<'EOF'
feat(utils): add getFirstName helper for greeting + future user surfaces

Centralizes first-token extraction so the new Greeting component on /home
and any future sidebar/user-menu surfaces share one definition. Returns
"Member" fallback when input is empty or whitespace.

Part of home dashboard redesign (Variant D); see
docs/plans/2026-04-30-home-dashboard-implementation.md.
EOF
)"
```

---

## Task 2: Add conference dot pulse keyframe to globals.css

**Files:**
- Modify: `src/app/globals.css`

**Why:** The conference section's status dot pulses when the conference is live. Tailwind's built-in `animate-pulse` is opacity-based; we want a `box-shadow` ring expansion (different visual register). Adding the keyframe in `globals.css` keeps it co-located with the design tokens it references (`--success`).

**Step 1: Read current globals.css to find a clean insertion point**

Read `src/app/globals.css` and locate the end of the `@layer base` block that defines `body { ... }` (around line 88). The keyframe goes outside `@layer base`, after that block.

**Step 2: Add the keyframe**

Append the following block to `src/app/globals.css` after the closing `}` of the second `@layer base { ... }` block (the one with `body { @apply ... }`):

```css
@keyframes ym-status-pulse {
  0%   { box-shadow: 0 0 0 0 oklch(var(--success) / 0.45); }
  70%  { box-shadow: 0 0 0 8px oklch(var(--success) / 0); }
  100% { box-shadow: 0 0 0 0 oklch(var(--success) / 0); }
}

@layer utilities {
  .animate-status-pulse {
    animation: ym-status-pulse 2.4s ease-out infinite;
  }
}
```

**Step 3: Verify the dev server still compiles**

Run (in a separate terminal, leave running): `bun run dev`

Watch for compilation errors. If clean, kill the server (Ctrl+C) once verified.

**Step 4: Typecheck and tests**

Run: `bunx tsc --noEmit && bun run test`

Expected: clean + previous test count.

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "$(cat <<'EOF'
feat(design): add ym-status-pulse keyframe for live-status indicators

Box-shadow ring expansion at the success token's hue, used by the
upcoming ConferenceAttendanceSection's live-state dot. Different visual
register from animate-pulse (opacity-based) — this is a "ring radiating
outward" effect that signals "active right now" without being noisy.

Exposed as the .animate-status-pulse utility under @layer utilities so
any component can opt in. Currently unused; consumed in a later commit
on this plan.
EOF
)"
```

---

## Task 3: `Greeting` component

**Files:**
- Create: `src/components/home/Greeting.tsx`

**Why:** Hero greeting at the top of the editorial home page. Two-line composition with the name in cobalt as the page's first visual accent.

**Step 1: Create the component**

Create `src/components/home/Greeting.tsx`:

```typescript
import { getFirstName } from '@/lib/utils/getFirstName'

interface GreetingProps {
  fullName: string
}

export function Greeting({ fullName }: GreetingProps) {
  const firstName = getFirstName(fullName)
  return (
    <h1 className="text-[clamp(2.5rem,5.5vw,3.5rem)] font-medium leading-[1.05] tracking-tight">
      Assalamu alaykum,
      <br />
      <span className="text-primary">{firstName}.</span>
    </h1>
  )
}
```

Notes for the implementer:
- `text-[clamp(2.5rem,5.5vw,3.5rem)]` reproduces the prototype's `clamp(40px, 5.5vw, 56px)` (rem-converted).
- `leading-[1.05]` matches the prototype's tight `line-height: 1.05`.
- `tracking-tight` is Tailwind's `-0.025em`, exactly what the prototype uses.
- The period after `{firstName}` is intentional — it's an editorial closing.

**Step 2: Add the component to the home barrel export**

Read `src/components/home/index.ts`. Append:

```typescript
export { Greeting } from './Greeting'
```

(Match the existing export style in that file — one line per component.)

**Step 3: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean.

**Step 4: Commit**

```bash
git add src/components/home/Greeting.tsx src/components/home/index.ts
git commit -m "$(cat <<'EOF'
feat(home): add Greeting component (editorial hero)

Two-line "Assalamu alaykum, / {firstName}." greeting for the redesigned
home page. Name on its own line in --primary; salam in --foreground.
Intentional period after the name — editorial closing. Type scale uses
clamp(2.5rem, 5.5vw, 3.5rem) so the greeting is hero-sized on desktop
and still legible at 375px mobile.

No subtitle — earlier draft included a date/time line; user removed it
as "too much complexity." Greeting is the one welcoming moment, not a
status board.

Part of home dashboard redesign (Variant D).
EOF
)"
```

---

## Task 4: `StatsStrip` component

**Files:**
- Create: `src/components/home/StatsStrip.tsx`

**Why:** Three-stat inline display ("Active members / NeighborNets / New this week"). No card wrapper — the design is intentionally a typographic strip.

**Step 1: Create the component**

Create `src/components/home/StatsStrip.tsx`:

```typescript
interface Stat {
  label: string
  value: string | number
  meta?: string
  metaAccent?: string
}

interface StatsStripProps {
  stats: [Stat, Stat, Stat]
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-8">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="text-[2.25rem] font-medium leading-none tracking-tight">
            {stat.value}
          </div>
          <div className="mt-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.10em] text-muted-foreground">
            {stat.label}
          </div>
          {stat.meta && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              {stat.metaAccent && (
                <span className="font-medium text-success">{stat.metaAccent} </span>
              )}
              {stat.meta}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

Notes:
- `text-[2.25rem]` is 36px — matches prototype's stat number scale.
- `tracking-[0.10em]` matches the prototype's stat-label spacing.
- The tuple type `[Stat, Stat, Stat]` enforces exactly three stats — the design assumes a fixed-width 3-column grid. If you find yourself wanting four, reconsider — adding a fourth makes the row cramped on desktop and breaks on mobile.

**Step 2: Add to barrel export**

Append to `src/components/home/index.ts`:

```typescript
export { StatsStrip } from './StatsStrip'
```

**Step 3: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean.

**Step 4: Commit**

```bash
git add src/components/home/StatsStrip.tsx src/components/home/index.ts
git commit -m "$(cat <<'EOF'
feat(home): add StatsStrip component (3 inline stats, no card)

Three-cell typographic strip for at-a-glance counts. No card wrapper —
just text with strong vertical hierarchy (large number / smallcaps label
/ optional muted meta). The tuple type enforces exactly three stats so
callers can't accidentally cram four into a row that won't survive
mobile layout.

Optional metaAccent prop renders a colored prefix in the meta line
(e.g., "+8" in success green for a delta).

Part of home dashboard redesign (Variant D).
EOF
)"
```

---

## Task 5: `QuickActionList` + `QuickActionRow` components

**Files:**
- Create: `src/components/home/QuickActionList.tsx`
- Create: `src/components/home/QuickActionRow.tsx`

**Why:** Replace `QuickActionCard` (separate cards per action) with a typographic list. The hover state is the load-bearing interaction on this section — orchestrated row tint + icon color shift + description color shift + arrow fade-in + 2px translate.

**Step 1: Create `QuickActionRow`**

Create `src/components/home/QuickActionRow.tsx`:

```typescript
import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface QuickActionRowProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export function QuickActionRow({
  href,
  icon: Icon,
  title,
  description,
}: QuickActionRowProps) {
  return (
    <Link
      href={href}
      className="group -mx-3 grid grid-cols-[24px_1fr_16px] items-center gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Icon className="h-[18px] w-[18px] text-muted-foreground transition-colors group-hover:text-primary" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.9375rem] font-medium">{title}</span>
        <span className="text-[0.8125rem] text-muted-foreground transition-colors group-hover:text-foreground">
          {description}
        </span>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  )
}
```

Notes:
- `group` on the Link enables `group-hover:` on children. This is the standard Tailwind pattern for orchestrated hover.
- `-mx-3 px-3` lets the hover background extend 12px past the column on each side without changing the content's alignment.
- `text-[0.9375rem]` = 15px (title), `text-[0.8125rem]` = 13px (description) — matches prototype.
- `ring-2 ring-primary ring-offset-2` keeps keyboard focus visible.

**Step 2: Create `QuickActionList`**

Create `src/components/home/QuickActionList.tsx`:

```typescript
import { type LucideIcon } from 'lucide-react'
import { QuickActionRow } from './QuickActionRow'

interface QuickAction {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

interface QuickActionListProps {
  actions: QuickAction[]
}

export function QuickActionList({ actions }: QuickActionListProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {actions.map((action) => (
        <QuickActionRow key={action.href} {...action} />
      ))}
    </div>
  )
}
```

**Step 3: Add to barrel export**

Append to `src/components/home/index.ts`:

```typescript
export { QuickActionList } from './QuickActionList'
export { QuickActionRow } from './QuickActionRow'
```

**Step 4: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean.

**Step 5: Commit**

```bash
git add src/components/home/QuickActionList.tsx src/components/home/QuickActionRow.tsx src/components/home/index.ts
git commit -m "$(cat <<'EOF'
feat(home): add QuickActionList + QuickActionRow (typographic list, no cards)

Replaces the QuickActionCard pattern. Each row is a typographic Link
with a 3-column grid (icon, body, arrow). Orchestrated hover:
- row gets bg-accent/70
- icon color shifts from muted-foreground to primary
- description color shifts from muted to foreground
- chevron fades in and translates 2px right

The four changes happen together so a single hover feels intentional.
This is the load-bearing interaction on the home page now that cards
are gone.

Part of home dashboard redesign (Variant D).
EOF
)"
```

---

## Task 6: `ConferenceAttendanceSection` component (null-render)

**Files:**
- Create: `src/components/home/ConferenceAttendanceSection.tsx`

**Why:** Reserve the slot in the home page layout for the conference section that lives front-and-center between the greeting and the hairline rule. Returns `null` until `feature/conferences` lands on `main`. The full design (live + upcoming states) is captured in the prototype; this component is the placeholder.

**Step 1: Create the component**

Create `src/components/home/ConferenceAttendanceSection.tsx`:

```typescript
interface ConferenceAttendanceSectionProps {
  userId: string
}

/**
 * Renders the user's most imminent conference attendance, between the
 * home page greeting and the hairline rule. Returns null when no
 * attendance exists.
 *
 * Currently a no-op: the `conferences` table lives on the
 * `feature/conferences` branch and is not yet on `main`. Once that
 * branch merges, this component should:
 *
 *   1. Add a `fetchUpcomingAttendance(userId)` query that joins
 *      `conference_attendees` → `conferences`, filters by
 *      `c.status = 'published' AND c.end_date >= today AND
 *      c.start_date <= today + interval '30 days'`, orders by
 *      `c.start_date ASC`, and returns the first row (or null).
 *   2. Compute `isLive = today >= start_date && today <= end_date`.
 *   3. Render the design from the editorial Variant D prototype at
 *      docs/prototypes/2026-04-30-home-dashboard/index.html — eyebrow
 *      (cobalt) + dot (success green, with `.animate-status-pulse`
 *      when `isLive`), conference name, date range, and a
 *      "View your schedule" link to `/conferences/{conferenceId}`.
 *   4. NO adaptive copy ("Day 2 of 3", session counts) — those wait
 *      for real product signals once the conferences feature has
 *      surfaced user behavior worth designing around.
 */
export async function ConferenceAttendanceSection({
  userId,
}: ConferenceAttendanceSectionProps) {
  void userId
  return null
}
```

Notes:
- `void userId` silences the unused-parameter lint without changing the public signature. The signature already accepts the eventual data input.
- The `async` keyword keeps the component shape ready for the eventual server-side fetch — even though the current body is synchronous.

**Step 2: Add to barrel export**

Append to `src/components/home/index.ts`:

```typescript
export { ConferenceAttendanceSection } from './ConferenceAttendanceSection'
```

**Step 3: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean.

**Step 4: Commit**

```bash
git add src/components/home/ConferenceAttendanceSection.tsx src/components/home/index.ts
git commit -m "$(cat <<'EOF'
feat(home): add ConferenceAttendanceSection placeholder (null-render)

Reserves the home-page slot between greeting and hairline rule for the
user's most imminent conference attendance. Returns null today — the
conferences feature lives on feature/conferences and hasn't reached main.

The component's docstring captures the implementation handoff: query
shape, lifecycle derivation, rendering rules. When feature/conferences
merges into main and then into feature/design, this is the file to fill
in. The rest of the home page composition (Task 7) already imports and
renders it, so the section will start appearing as soon as the data
layer exists.

The animate-status-pulse utility added in an earlier commit is
specifically for the live-state dot here.

Part of home dashboard redesign (Variant D).
EOF
)"
```

---

## Task 7: `fetchHomeStats` server query

**Files:**
- Read first: `src/lib/supabase/queries/index.ts` (to learn the existing query export pattern)
- Read first: `src/lib/supabase/queries/userContext.ts` or whatever defines `fetchUserContext` (to learn the existing query style)
- Create: `src/lib/supabase/queries/homeStats.ts`
- Modify: `src/lib/supabase/queries/index.ts` (add the export)

**Why:** The `StatsStrip` needs three counts: active members, NeighborNets, new this week. Server-side query, runs once per home page render.

**Step 1: Inspect the existing query layer**

Run:
```bash
ls src/lib/supabase/queries/
cat src/lib/supabase/queries/index.ts
```

Identify the file that defines `fetchUserContext` (the existing home-page query). Read it to learn:
- How the supabase server client is acquired
- How errors are handled
- How return types are shaped
- Whether queries return raw data or transform it

Match that style.

**Step 2: Create the query module**

Create `src/lib/supabase/queries/homeStats.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface HomeStats {
  activeMembers: number
  newThisWeek: number
  neighborNets: number
}

export async function fetchHomeStats(
  supabase: SupabaseClient,
): Promise<HomeStats> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  const [
    { count: activeMembers },
    { count: newThisWeek },
    { count: neighborNets },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true)
      .gte('created_at', sevenDaysAgoIso),
    supabase
      .from('neighbor_nets')
      .select('*', { count: 'exact', head: true }),
  ])

  return {
    activeMembers: activeMembers ?? 0,
    newThisWeek: newThisWeek ?? 0,
    neighborNets: neighborNets ?? 0,
  }
}
```

**Important:** the column names above (`is_claimed`, `created_at`, table name `neighbor_nets`) are educated guesses. **Before committing, verify against the schema** by running:

```bash
ls supabase/migrations/
grep -r "CREATE TABLE users" supabase/migrations/ | head -3
grep -r "CREATE TABLE neighbor" supabase/migrations/ | head -3
```

If the columns or table names differ, adjust the query. If `is_claimed` doesn't exist, check the existing `fetchUserContext` query for how it determines who is an "active" / claimed user — match that semantic exactly. **Do not invent fields** — if "claimed" status uses a different mechanism (e.g., presence of `auth.users` row, non-null `email_verified_at`, etc.), use that.

**Step 3: Add the export**

Append to `src/lib/supabase/queries/index.ts`:

```typescript
export { fetchHomeStats, type HomeStats } from './homeStats'
```

(Or match whatever the existing export style is in that file.)

**Step 4: Typecheck**

Run: `bunx tsc --noEmit`

Expected: clean. If the supabase types complain about column names, that means your column-name guess was wrong — fix it (see Step 2's note).

**Step 5: Smoke test the query manually**

Start the dev server: `bun run dev`

In a browser console (or by adding a temporary `console.log` to the page), call the query against a logged-in user. Confirm the three counts are non-NaN, non-undefined integers. Remove any temporary logging before committing.

**Step 6: Commit**

```bash
git add src/lib/supabase/queries/homeStats.ts src/lib/supabase/queries/index.ts
git commit -m "$(cat <<'EOF'
feat(queries): add fetchHomeStats for the home-page stats strip

Three parallel count queries (active members, new this week, NeighborNets).
All `head: true` count-only requests — no row payload, just the counts.

Used by /home's new StatsStrip component. Runs once per home page render,
server-side. The 7-day window for "new this week" is computed from now()
client-side and passed as an ISO timestamp to the server, so it stays
consistent across timezones.

Part of home dashboard redesign (Variant D).
EOF
)"
```

---

## Task 8: Wire it all together — replace the home page

**Files:**
- Modify: `src/app/(app)/home/page.tsx` (full rewrite of the body)

**Why:** Compose the editorial Variant D layout using the components built in Tasks 3–7. This is the visible delta of this entire plan.

**Step 1: Read the current home page to preserve auth + redirect logic**

Read `src/app/(app)/home/page.tsx`. Note:
- The auth check (`supabase.auth.getSession()` and the redirect on no session)
- How `fetchUserContext` is called and what fields it returns
- What `displayName`, `displayRoles`, `displayNN`, `displaySR` contain

The new implementation must keep the same auth posture. Only the body composition changes.

**Step 2: Rewrite the file**

Replace the body of `src/app/(app)/home/page.tsx` with:

```typescript
import { redirect } from 'next/navigation'
import { Users, DollarSign, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchUserContext, fetchHomeStats } from '@/lib/supabase/queries'
import {
  Greeting,
  QuickActionList,
  StatsStrip,
  ConferenceAttendanceSection,
} from '@/components/home'

const QUICK_ACTIONS = [
  { href: '/people', icon: Users, title: 'People', description: 'Browse YM members' },
  { href: '/finance', icon: DollarSign, title: 'Finance', description: 'Reimbursements' },
  { href: '/docs', icon: FileText, title: 'Docs', description: 'Halaqa & SOPs' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const [userContext, stats] = await Promise.all([
    fetchUserContext(session.user.id),
    fetchHomeStats(supabase),
  ])

  const displayName = userContext?.name || session.user.email?.split('@')[0] || 'Member'
  const displayRoles = userContext?.roles ?? []
  const displayNN = userContext?.neighborNetName || 'No NeighborNet'
  const displaySR = userContext?.subregionName || ''

  return (
    <div className="px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto flex max-w-[600px] flex-col">
        <Greeting fullName={displayName} />

        <ConferenceAttendanceSection userId={session.user.id} />

        <hr className="mt-12 mb-14 border-t border-border" />

        <section className="space-y-1">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Who you are
          </div>
          <p className="text-[1.0625rem] font-medium leading-[1.4]">
            {displayRoles.length > 0 ? displayRoles.join(' · ') : 'No roles yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {displayNN}{displaySR && ` · ${displaySR}`}
          </p>
        </section>

        <section className="mt-14">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Quick actions
          </div>
          <QuickActionList actions={QUICK_ACTIONS} />
        </section>

        <section className="mt-14">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            At a glance
          </div>
          <StatsStrip
            stats={[
              {
                label: 'Active members',
                value: stats.activeMembers,
                meta: 'this month',
                metaAccent: stats.newThisWeek > 0 ? `+${stats.newThisWeek}` : undefined,
              },
              {
                label: 'NeighborNets',
                value: stats.neighborNets,
                meta: stats.neighborNets === 1 ? 'across the network' : undefined,
              },
              {
                label: 'New this week',
                value: stats.newThisWeek,
                meta: stats.newThisWeek > 0 ? 'welcome them' : '—',
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
```

Notes:
- `Promise.all` runs the user-context fetch and stats fetch in parallel — same posture the home page already had (single fetch was its bottleneck).
- The `hr` between conference section and "Who you are" is the editorial hairline rule from the prototype.
- The eyebrow class string is repeated three times on this page. **Do not** extract it into a helper component yet — the rule is "wait for the third occurrence" before extracting (you have it now), but extracting requires designing a `Eyebrow` component prop API that handles edge cases. **Defer extraction to a follow-up commit if the duplication bothers you**; this commit's scope is "ship D."
- The `hr` border explicitly uses `border-border` token, not arbitrary color.
- The conditional metaAccent on Active members handles the `+N this week` overlay; if no new members this week, the accent line is suppressed.

**Step 3: Run the dev server and smoke test**

Run: `bun run dev`

Open the home page at http://localhost:3000/home (or the port Next picks). Sign in if needed.

Verify visually:
- [ ] Greeting renders "Assalamu alaykum, {firstName}." with the name in cobalt
- [ ] No date/time subtitle under the greeting
- [ ] Hairline rule between greeting area and "Who you are"
- [ ] No card chrome anywhere on the page (no rounded white boxes)
- [ ] Three eyebrow labels (uppercase smallcaps): Who you are / Quick actions / At a glance
- [ ] QuickActionList renders three rows; hovering one shows: bg tint, icon turns cobalt, description darkens, chevron appears + slides 2px right
- [ ] StatsStrip shows three stats in a row with large numbers
- [ ] No console errors
- [ ] Layout is top-aligned, not vertically centered

Verify at 375px width (DevTools mobile mode):
- [ ] Greeting is still legible (clamp brings it down to ~40px)
- [ ] Stats strip remains 3 columns, but might be tight — that's expected for now (audit-deferred mobile pass)

If the conference section ever renders something here, that's a bug — it should return null until conferences ships.

**Step 4: Typecheck and tests**

Run: `bunx tsc --noEmit && bun run test`

Expected: clean + previous count of passing tests.

**Step 5: Commit**

```bash
git add src/app/\(app\)/home/page.tsx
git commit -m "$(cat <<'EOF'
feat(home): replace centered card stack with editorial layout (Variant D)

Composes the new home dashboard from Greeting + ConferenceAttendanceSection
(currently null-render) + Who-you-are typography + QuickActionList +
StatsStrip. No Card primitives in the rendered DOM at /home.

Layout is top-aligned (px-6 py-12 sm:px-10 sm:py-16, max-w-[600px]) —
the previous flex items-center min-h-screen posture is gone. Stats are
fetched in parallel with user context via Promise.all so total wait is
the slower of the two queries, not the sum.

This commit is the visible delta of the home dashboard redesign — every
prior commit in this plan was a setup or component definition; here
they all light up at once. The conference section will start appearing
automatically when feature/conferences merges to main and brings the
data layer; until then, ConferenceAttendanceSection's null return keeps
the slot empty and the layout collapses gracefully.

Resolves Phase 2 / Section 3 HIGH IMPACT #2 (Home page — make it a
real dashboard) from docs/plans/2026-02-16-ui-design-audit.md, partial:
greeting, dashboard layout, and stats are landed; "recent activity"
remains scoped to stats counts (not an event feed); conference section
waits on cross-branch merge.
EOF
)"
```

---

## Task 9: Delete unused components

**Files:**
- Possibly delete: `src/components/home/PersonalContextCard.tsx`
- Possibly delete: `src/components/home/QuickActionCard.tsx`
- Possibly delete: `src/components/home/HomePageSkeleton.tsx` if it references the dead components
- Modify: `src/components/home/index.ts` (remove exports for deleted files)

**Why:** Both `PersonalContextCard` and `QuickActionCard` were home-only components, replaced by the editorial composition. Dead code is worse than no code.

**Step 1: Verify no other consumers**

Run:
```bash
grep -rn "PersonalContextCard" src/ --include="*.ts" --include="*.tsx"
grep -rn "QuickActionCard" src/ --include="*.ts" --include="*.tsx"
```

If the only references are inside the file itself and the barrel export (`src/components/home/index.ts`), they are safe to delete.

If anything in `src/app` (other than `home/page.tsx`, which already doesn't import them after Task 8) references them, **STOP** and surface — don't delete.

**Step 2: Delete the files**

```bash
rm src/components/home/PersonalContextCard.tsx
rm src/components/home/QuickActionCard.tsx
```

**Step 3: Update the barrel export**

Edit `src/components/home/index.ts` and remove the lines exporting the deleted components.

**Step 4: Check `HomePageSkeleton.tsx`**

Read `src/components/home/HomePageSkeleton.tsx`. If it references the deleted components or simulates the old centered/card layout, rewrite it to match the new editorial layout's skeleton shape (greeting placeholder + section placeholders for identity/actions/stats). If it's already generic enough, leave it.

**If you rewrite it:** keep the `Skeleton` primitive (don't reintroduce shimmer — that was rejected in this session). Match the new layout's vertical rhythm.

**Step 5: Typecheck and tests**

Run: `bunx tsc --noEmit && bun run test`

Expected: clean.

**Step 6: Commit**

```bash
git add -A src/components/home/
git commit -m "$(cat <<'EOF'
chore(home): delete PersonalContextCard and QuickActionCard

Both were home-only components, replaced by the editorial composition
(Greeting + plain-typography "Who you are" + QuickActionList) shipped in
the prior commit. Verified no other consumers via grep before deletion.

HomePageSkeleton {updated to match the new layout shape | left as-is}.
EOF
)"
```

(Adjust the trailing brace clause based on whether you rewrote the skeleton.)

---

## Task 10: Tick the audit doc

**Files:**
- Modify: `docs/plans/2026-02-16-ui-design-audit.md` (Section 3 HIGH IMPACT #2)

**Step 1: Find the section**

Read `docs/plans/2026-02-16-ui-design-audit.md` and locate "#### 2. Home page — make it a real dashboard" (around line 123).

**Step 2: Update**

Replace the section with:

```markdown
#### 2. Home page — make it a real dashboard (partial ✅)

- ~~PersonalContextCard should be larger and more prominent~~ Replaced — identity now renders as plain editorial typography under a "Who you are" eyebrow; the gradient card wrapper is gone. The home page no longer has any card chrome at all (D direction).
- ~~Add time-of-day greeting ("Assalamu alaykum, Omar")~~ Done — `Greeting` component renders "Assalamu alaykum, {firstName}." with the name in cobalt. No time/date subtitle (intentionally simpler than the audit's literal suggestion).
- ~~QuickActionCards need more visual weight — larger icons, category-specific tints~~ Replaced — `QuickActionList` is a typographic list, not separate cards. "Category-specific tints" remains deferred to the brand-direction conversation (would need secondary accent decision).
- "Add a 'recent activity' or 'upcoming' section" — _partially addressed via `StatsStrip` (Active members / NeighborNets / New this week)._ A full activity feed remains unresolved; the conditional `ConferenceAttendanceSection` (lands once `feature/conferences` reaches `main`) covers the most important "upcoming" case for attendees.
```

**Step 3: Commit**

```bash
git add docs/plans/2026-02-16-ui-design-audit.md
git commit -m "$(cat <<'EOF'
docs(audit): tick Section 3 HIGH IMPACT #2 (home page) partial

Greeting, layout (top-aligned, no cards), and stats strip have shipped
in this branch's home-dashboard work. Conference attendance section is
in place as a null-render until feature/conferences lands. Recent
activity feed remains unaddressed; QuickActionCard tints remain deferred
to the brand-direction conversation.
EOF
)"
```

---

## Final state — verify before declaring done

Run all of the following and confirm pass:

```bash
bunx tsc --noEmit
bun run test
bun run build
```

Expected:
- Typecheck: clean
- Tests: all pass (84 baseline + 6 new = 90+)
- Build: succeeds end-to-end

Manually verify in dev mode (`bun run dev`):
- [ ] `/home` renders the new editorial layout
- [ ] No console errors
- [ ] No card chrome on `/home`
- [ ] Greeting in cobalt, hairline rule, three sections beneath
- [ ] QuickAction hover orchestration works (bg tint + icon color + arrow appear/translate)
- [ ] Stats strip shows three real numbers
- [ ] At 375px the layout doesn't break (greeting clamps down, sections stack vertically as expected)

Then summarize commits:

```bash
git log --oneline 9105e98..HEAD
```

(`9105e98` is the A2 commit landed before this plan; later commits are the design-batch work + this plan's commits.)

---

## Notes for the implementer

- **Don't add TaskCreate/TodoWrite tasks for plan steps** — `superpowers:executing-plans` handles tracking.
- **Don't push without explicit user OK** — branch is `feature/design`. Local commits only, unless told otherwise.
- **NEVER include Claude as a co-author** in commit messages or add AI-generated footers (CLAUDE.md rule).
- **Use HEREDOC for commit messages** to preserve newlines (CLAUDE.md rule).
- **One commit per task** — DO NOT batch multiple tasks into a single commit.
- **If you hit a blocker** — column name doesn't exist, test fails for unexpected reason, prototype CSS doesn't translate cleanly — STOP and surface. Don't guess.
- **The dev server may already be running** on port 3000 from a previous session. If you need it, check `lsof -i :3000` first.
- **Reference the prototype** (`docs/prototypes/2026-04-30-home-dashboard/index.html`) for visual ground truth. The Variant D mockup is canonical — if your implementation diverges, the prototype wins.

## What this plan does not do (deferred work)

- **Brand direction items** — secondary accent color, typography pairing, display font, illustrations, branded loaders. These need a separate brand-direction conversation. They are *not* in this plan.
- **`/conferences` route changes** — those live on `feature/conferences`. This plan only reserves the home-page slot for attendance display.
- **`HomePageSkeleton` redesign** — touched in Task 9 but not deeply rethought. A full skeleton-shape match is polish; this plan's scope is functional.
- **Mobile-specific layout passes** — D works at 375px but the stats strip is tight. A proper mobile pass (column stacking, larger touch targets) is a follow-up.
- **Adaptive copy on the conference section** — "Day 2 of 3", "47 sessions today", etc. Wait for real product signals.

## When this plan is done

Two reasonable next moves:

1. **Visual eyeball + push to remote** — give the user OK to push the branch.
2. **Open the brand-direction conversation** — the deferred items above (#4 secondary accent, #5 typography, #10 illustrations, #11 branded loaders) are bottlenecking the rest of Section 3. They need a dedicated session with the user, not implementation churn.
