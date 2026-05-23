# Admin Schedule Master-Detail Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the modal-driven admin schedule editor with a desktop-first master-detail split panel (Linear/GitHub Issues style): persistent right panel holds view + edit + create + delete + roster, no Dialog or Sheet chrome.

**Architecture:** Single grid layout (`grid-cols-2`, even 50/50 split) — left column shows day-grouped session rows on a `muted` background, right column is a stateful `SessionPanel` on the `card` background that switches between `empty | view | edit | create | delete` modes. `ScheduleEditor` owns panel state and exposes an imperative `openCreate()` handle so the parent `ConferenceEditor` can trigger create from a header button.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, shadcn/ui (Tabs/Input/Select/Textarea/Button), Tailwind 3, Supabase client (roster fetch), date-fns, Sonner toasts.

**Branch:** `feat/admin-rebuild` cut from `main`.

**Prototype reference:** `admin-schedule-ux-v2.html` at repo root.

---

## For the executing agent: how to read this plan

This plan is opinionated about **architecture and data flow** but should be flexible on **styling specifics**. Before writing any UI code:

1. **Read CLAUDE.md and `MEMORY.md`** — they set hard rules (design tokens only, no arbitrary colors, lucide icons only, shadcn-first, Sonner toasts, animation duration-200, etc.).
2. **Grep for existing patterns before inventing new ones.** Examples worth checking:
   - Panel chrome: `RosterSheet.tsx` for sheet header/footer spacing
   - Form fields: `SessionEditor.tsx` for label/input pairing, validation pattern, ModeToggle
   - Empty states: search for `bg-muted/50 p-4` (the project's empty-state circle)
   - Selected/active rows: search the codebase for any list-with-selection (people-table, attendee picker) and match its tier vocabulary
3. **Tailwind class strings in this plan are illustrative, not literal.** Where I wrote `min-h-[60px]` or `px-[18px]`, prefer the scale equivalents (`min-h-16`, `px-5`) if they fit. The prototype uses arbitrary pixels because it's vanilla CSS; the production code should speak the design system's language.
4. **Match neighbors over matching the prototype.** If `SessionEditor.tsx` uses `Label className="text-xs"`, the new form should too — even if the prototype says `text-[11px]`. The prototype encodes *intent* (small label, muted color, above the input); the codebase encodes *convention* (which exact shadcn `Label` props to use). Convention wins.
5. **OKLCH tokens only for colors.** The prototype uses raw hex (`#f1f3f5`, `#e1e4e8`) because it's a static HTML mock. The production component must use `bg-muted`, `border-border`, etc. If a needed shade doesn't exist as a token, either find a `/40`/`/60` modifier on an existing one or stop and ask — do not introduce a new hex.
6. **Visual fidelity is approximate.** If you can't perfectly match the prototype's hover-vs-selected delta with design-system tokens alone, ship the closest legible version and note the deviation in the PR. We can refine tokens later if it's a recurring problem.

The architecture decisions, data flow, file boundaries, and TDD sequence below are **locked** — don't deviate without flagging.

---

## Files Touched

| Action | File |
|---|---|
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/SessionPanel.tsx` |
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/loadRoster.ts` |
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/fixtures.ts` (shared `Conference`/`AdminSession` builders for the three test files below) |
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/SessionPanel.test.tsx` |
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/ScheduleEditor.test.tsx` |
| Create | `src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/loadRoster.test.ts` |
| Rewrite | `src/app/(app)/admin/conferences/[conferenceId]/components/ScheduleEditor.tsx` |
| Modify | `src/app/(app)/admin/conferences/[conferenceId]/ConferenceEditor.tsx` |
| Delete | `src/app/(app)/admin/conferences/[conferenceId]/components/SessionEditor.tsx` |
| Delete | `src/app/(app)/admin/conferences/[conferenceId]/components/RosterSheet.tsx` |
| Delete prototypes | `admin-schedule-ux-prototype.html`, `admin-schedule-ux-v2.html` (after merge) |

---

## Design Reference (state shapes)

```typescript
// In ScheduleEditor.tsx
type PanelMode = 'empty' | 'view' | 'edit' | 'create' | 'delete'

interface PanelState {
  mode: PanelMode
  selectedSession: AdminSession | null  // populated for view | edit | delete
  createDefaultDate: string | undefined // populated for create only
}

// Exposed via useImperativeHandle to ConferenceEditor
export interface ScheduleEditorHandle {
  openCreate: (date?: string) => void
}
```

## Design Reference (visual tokens)

The prototype `admin-schedule-ux-v2.html` is the visual source of truth. Key
token mappings — translate to Tailwind classes against the design system:

| Element | Token / class |
|---|---|
| Grid | `grid grid-cols-2 min-h-[640px] border rounded-lg overflow-hidden` |
| Left pane | `border-r overflow-y-auto bg-muted/40` |
| Right pane | `bg-background flex flex-col` |
| Row idle | `bg-card border border-transparent rounded-lg` |
| Row hover | `hover:bg-muted/60 hover:border-border/60` |
| Row **selected** | `bg-muted border-border` — **no brand color, no left rail, no text recoloring**. Selection signals through value contrast only. |
| Row min-height | `min-h-[60px]` (sessions), `min-h-[48px]` (breaks) |
| Row gap inside day | `gap-1.5` (~6px) |
| Day header | `pt-5 pb-3 px-6 sticky top-0 bg-muted/40 z-10` |
| Add-on-day button | `mt-2.5 mx-[18px] border border-dashed text-muted-foreground rounded-md py-2.5` |
| Panel header (`pmode-hdr`) | `px-5 pt-5 pb-3.5 border-b` |
| Panel eyebrow | `text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5` (or `text-muted-foreground` for break, `text-destructive` for delete) |
| Panel footer | `px-5 py-3 border-t bg-muted/30 flex justify-end gap-2 items-center min-h-[56px]` |
| ModeToggle card | `mx-5 mt-3.5 p-3 border rounded-md bg-muted/40 flex items-center gap-3` |

**Selected state rationale:** Brand-tinted backgrounds + colored text + left rails make the selection compete with data (signups, capacity, full state) for visual attention. Neutral muted fill with unchanged text reads as "this is current" through value contrast alone. Matches Linear/Notion/Cron patterns.

---

## Task 1: Cut the branch

**Files:** none

**Step 1: Verify working-tree state**

```bash
git status
```

Expected (post-merge of PR #19, 2026-05-19): on `main`, in sync with `origin/main`. Untracked = the two prototype HTML files (`admin-schedule-ux-*.html`) plus this plan file. If you see other modifications, reconcile them before continuing.

**Step 2: Cut the branch**

```bash
git switch -c feature/admin-rebuild
```

Expected: `Switched to a new branch 'feature/admin-rebuild'`. Branch name follows CLAUDE.md's `feature/*` convention.

**Step 3: Stash prototypes + plan onto the branch**

The two prototype HTML files and this plan file are reference material for this rebuild — move them onto the feature branch so they're in scope. Prototypes get deleted in the final cleanup task before merge; the plan stays as a permanent record.

```bash
git add admin-schedule-ux-prototype.html admin-schedule-ux-v2.html \
        docs/plans/2026-05-18-admin-schedule-rebuild.md
git commit -m "chore(admin): bring schedule rebuild prototypes + plan onto feature branch"
```

---

## Task 2: Create `SessionPanel.tsx` empty + view modes (no roster yet)

**Files:**
- Create: `src/app/(app)/admin/conferences/[conferenceId]/components/SessionPanel.tsx`

**Step 1: Create shared fixtures + write failing test — empty mode renders empty state**

First, create `__tests__/fixtures.ts` so the three test files (`SessionPanel`, `ScheduleEditor`, `loadRoster`) share one source of truth for required type fields. The exact shapes are dictated by `src/app/(app)/conferences/[conferenceId]/types.ts` (`Conference` and `Session`) plus `src/app/(app)/admin/conferences/types.ts` (`AdminSession`):

```typescript
// __tests__/fixtures.ts
import type { Conference, AdminSession } from '../../../types'

export function makeConference(overrides: Partial<Conference> = {}): Conference {
  return {
    id: 'c1',
    name: 'Test Conf',
    tagline: null,
    description: null,
    location: 'Boston',
    timezone: 'America/New_York',
    start_date: '2026-06-01',
    end_date: '2026-06-03',
    status: 'published',
    published_at: '2026-05-01T00:00:00Z',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

export function makeSession(overrides: Partial<AdminSession> = {}): AdminSession {
  return {
    id: 's1',
    conference_id: 'c1',
    start_at: '2026-06-01T13:00:00Z',
    end_at: '2026-06-01T14:00:00Z',
    title: 'Opening Keynote',
    description: null,
    speaker: 'Dr. Ansari',
    room: 'Ballroom A',
    is_break: false,
    capacity: 80,
    check_in_code: null,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}
```

Then create `__tests__/SessionPanel.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SessionPanel } from '../SessionPanel'
import { makeConference } from './fixtures'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

describe('SessionPanel', () => {
  it('shows empty state when mode is empty', () => {
    render(
      <SessionPanel
        conference={makeConference()}
        sessions={[]}
        signupCounts={{}}
        checkInCounts={{}}
        mode="empty"
        selectedSession={null}
        createDefaultDate={undefined}
        onModeChange={() => {}}
        onSaved={() => {}}
        onAfterDelete={() => {}}
        onDirtyChange={() => {}}
      />
    )
    expect(screen.getByText(/select a session/i)).toBeInTheDocument()
  })
})
```

Note: the `Props` interface in step 3 only declares `onModeChange` + `onAfterDelete` (used in Task 2 + 3). `onSaved` and `onDirtyChange` are added in Task 4 — pass `() => {}` no-ops here so this test still compiles after the prop additions land.

**Step 2: Run test to verify it fails**

```bash
bun run test -- SessionPanel
```

Expected: FAIL — "Cannot find module '../SessionPanel'"

**Step 3: Implement the empty + view skeleton**

Create `SessionPanel.tsx`:

```typescript
'use client'

import { Calendar, Coffee, Edit, MapPin, Trash2, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { decomposeTzIso } from '../../lib/datetime'
import type { AdminSession, Conference } from '../../types'

export type PanelMode = 'empty' | 'view' | 'edit' | 'create' | 'delete'

interface Props {
  conference: Conference
  sessions: AdminSession[]
  signupCounts: Record<string, number>
  checkInCounts: Record<string, number>
  mode: PanelMode
  selectedSession: AdminSession | null
  createDefaultDate: string | undefined
  onModeChange: (mode: PanelMode, session?: AdminSession | null) => void
  onAfterDelete: () => void
}

export function SessionPanel(props: Props) {
  const { mode } = props
  if (mode === 'empty') return <EmptyState />
  if (mode === 'view' && props.selectedSession) {
    return <ViewMode {...props} session={props.selectedSession} />
  }
  // Edit / create / delete modes added in later tasks.
  return <EmptyState />
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Calendar className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight mb-1">
        Select a session
      </h3>
      <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
        Click a row on the left to view details, roster, and check-ins.
      </p>
    </div>
  )
}

function ViewMode({
  conference,
  session,
  signupCounts,
  checkInCounts,
  onModeChange,
}: Props & { session: AdminSession }) {
  const startWall = decomposeTzIso(session.start_at, conference.timezone)
  const endWall = decomposeTzIso(session.end_at, conference.timezone)
  const signups = signupCounts[session.id] ?? 0
  const checkIns = checkInCounts[session.id] ?? 0

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 pb-4 border-b space-y-2">
        <div className="text-xs uppercase tracking-widest text-primary font-medium">
          {session.is_break ? (
            <span className="inline-flex items-center gap-1">
              <Coffee className="w-3 h-3" />
              Break
            </span>
          ) : (
            'Session'
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{session.title}</h2>
        <p className="text-sm text-muted-foreground">
          {format(parseISO(startWall.date), 'EEEE, MMMM d')} ·{' '}
          {formatTime(startWall.time)} – {formatTime(endWall.time)}
        </p>
        {session.room && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {session.room}
          </p>
        )}
      </header>

      {session.description && (
        <div className="px-6 py-4 text-sm leading-relaxed text-foreground/80 border-b">
          {session.description}
        </div>
      )}

      {!session.is_break && (
        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b">
          <Stat label="Signed up" value={
            session.capacity != null ? `${signups} / ${session.capacity}` : String(signups)
          } />
          <Stat label="Checked in" value={checkIns === 0 ? '—' : String(checkIns)} />
        </div>
      )}

      {/* Roster section added in Task 3. */}
      <div className="flex-1" />

      <footer className="px-6 py-3 border-t bg-muted/30 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('delete', session)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
        <Button size="sm" onClick={() => onModeChange('edit', session)}>
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}
```

**Step 4: Run test to verify it passes**

```bash
bun run test -- SessionPanel
```

Expected: PASS — `shows empty state when mode is empty`

**Step 5: Commit**

```bash
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/components/SessionPanel.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/SessionPanel.test.tsx
git commit -m "feat(admin): add SessionPanel skeleton with empty and view modes"
```

---

## Task 3: Add roster section to view mode

**Files:**
- Modify: `src/app/(app)/admin/conferences/[conferenceId]/components/SessionPanel.tsx`

**Step 1: Write failing test — view mode shows roster section with filter tabs**

Add to `__tests__/SessionPanel.test.tsx`:

```typescript
import { makeConference, makeSession } from './fixtures'

it('renders roster filter tabs in view mode for sessions', () => {
  const session = makeSession()  // defaults: not a break, capacity 80
  render(
    <SessionPanel
      conference={makeConference()}
      sessions={[session]}
      signupCounts={{ s1: 12 }}
      checkInCounts={{ s1: 5 }}
      mode="view"
      selectedSession={session}
      createDefaultDate={undefined}
      onModeChange={() => {}}
      onSaved={() => {}}
      onAfterDelete={() => {}}
      onDirtyChange={() => {}}
    />
  )
  expect(screen.getByRole('tab', { name: /^all/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /checked in/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /not checked in/i })).toBeInTheDocument()
})
```

Mock the Supabase client at module scope so `loadRoster` resolves with a stub roster (only needed because view mode auto-loads on mount):

```typescript
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          then: (cb: (r: { data: unknown[]; error: null }) => unknown) =>
            cb({ data: [], error: null }),
        }),
      }),
    }),
  }),
}))
```

**Step 2: Run test to verify it fails**

```bash
bun run test -- SessionPanel
```

Expected: FAIL — no tabs found.

**Step 3: Extract `loadRoster` into its own file**

Before porting the UI, lift the data function out of `RosterSheet.tsx` into a standalone module so we can unit-test it independently.

Create `loadRoster.ts`:

```typescript
// Copy the entire bottom-of-RosterSheet.tsx `loadRoster` function verbatim
// plus the `RosterEntry` interface. Export both.
```

Create `__tests__/loadRoster.test.ts` covering: merge on `user_id`, checked-in-first sort by `checked_in_at`, then alphabetical for the rest. The Supabase chain (`from().select().eq().order()` for signups, `from().select().eq()` for check-ins, both inside `Promise.all`) requires a chain-aware mock — sketch:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'

const signupsBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn(),  // returns the resolved value per test
}
const checkInsBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn(),     // resolved value per test — no .order() here
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) =>
      table === 'session_signups' ? signupsBuilder : checkInsBuilder,
  }),
}))

import { loadRoster } from '../loadRoster'

beforeEach(() => {
  signupsBuilder.select.mockReturnThis()
  signupsBuilder.eq.mockReturnThis()
  checkInsBuilder.select.mockReturnThis()
})

it('puts checked-in users first, ordered by check-in time', async () => {
  signupsBuilder.order.mockResolvedValue({
    data: [
      { user_id: 'u1', users: { first_name: 'Alice', last_name: 'A' } },
      { user_id: 'u2', users: { first_name: 'Bob',   last_name: 'B' } },
      { user_id: 'u3', users: { first_name: 'Cara',  last_name: 'C' } },
    ],
    error: null,
  })
  checkInsBuilder.eq.mockResolvedValue({
    data: [
      { user_id: 'u3', checked_in_at: '2026-06-01T13:05:00Z' },
      { user_id: 'u1', checked_in_at: '2026-06-01T13:02:00Z' },
    ],
    error: null,
  })
  const res = await loadRoster('s1')
  expect(res.error).toBeNull()
  expect(res.entries.map((e) => e.name)).toEqual(['Alice A', 'Cara C', 'Bob B'])
})
```

Add an error-path test that returns `error` from `signupsRes` and asserts `entries: []`.

**Step 4: Port roster UI from `RosterSheet.tsx`**

In `SessionPanel.tsx`, replace the `{/* Roster section added in Task 3. */}` placeholder with the full roster section. Move these pieces verbatim from `RosterSheet.tsx`:

- `type Filter = 'all' | 'in' | 'out'`
- Import `loadRoster` and `RosterEntry` from `./loadRoster`
- `<Tabs value={filter} ...>` block with three triggers
- `<Input>` search box
- `<RosterRow>`, `<LoadingState>`, `<ErrorState>`, `<EmptyAll>`, `<EmptyFiltered>` helpers

Wire into `ViewMode`:

```typescript
function ViewMode({ session, conference, ... }: ...) {
  const [entries, setEntries] = useState<RosterEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setEntries(null); setError(null); setFilter('all'); setSearch('')
    if (session.is_break) return  // breaks have no roster
    let cancelled = false
    void loadRoster(session.id).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setEntries(res.entries)
    })
    return () => { cancelled = true }
  }, [session.id, session.is_break])

  // ...filtered/counts memos same as RosterSheet

  return (
    <div className="flex flex-col h-full">
      {/* header, description, stats — same as before */}
      {!session.is_break && (
        <>
          <div className="px-6 pt-4 pb-3 border-b space-y-3 shrink-0">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              {/* three triggers with count badges */}
            </Tabs>
            {/* Input search box */}
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* error / loading / empty / list states */}
          </div>
        </>
      )}
      {session.is_break && <div className="flex-1" />}
      {/* footer with Edit/Delete */}
    </div>
  )
}
```

**Step 5: Run tests to verify they pass**

```bash
bun run test -- SessionPanel loadRoster
```

Expected: PASS — three tabs rendered, loadRoster merge + sort cases pass.

**Step 6: Run full test suite + type-check**

```bash
bun run test && bunx tsc --noEmit
```

Expected: both clean.

**Step 7: Commit**

```bash
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/components/SessionPanel.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/loadRoster.ts \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/SessionPanel.test.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/loadRoster.test.ts
git commit -m "feat(admin): extract loadRoster and port roster UI into SessionPanel"
```

---

## Task 4: Add edit + create mode (port form from `SessionEditor.tsx`)

This task is **deliberately split into three commits** — porting the form, wiring post-save reconciliation, and adding the unsaved-changes guard. Each substep below ends with its own commit so the diff stays reviewable.

**Files:**
- Modify: `src/app/(app)/admin/conferences/[conferenceId]/components/SessionPanel.tsx`

### Task 4a — Port form fields, validation, and submit (no dirty tracking yet)

**Step 1: Write failing tests — edit mode prefills, create mode is blank**

Add to `__tests__/SessionPanel.test.tsx`:

```typescript
it('prefills title input when entering edit mode', () => {
  const session = makeSession({ title: 'Opening Keynote' })
  render(
    <SessionPanel
      conference={makeConference()}
      sessions={[session]}
      signupCounts={{}}
      checkInCounts={{}}
      mode="edit"
      selectedSession={session}
      createDefaultDate={undefined}
      onModeChange={() => {}}
      onSaved={() => {}}
      onAfterDelete={() => {}}
      onDirtyChange={() => {}}
    />
  )
  expect(screen.getByLabelText(/title/i)).toHaveValue('Opening Keynote')
})

it('shows blank form in create mode', () => {
  render(
    <SessionPanel
      conference={makeConference()}
      sessions={[]}
      signupCounts={{}}
      checkInCounts={{}}
      mode="create"
      selectedSession={null}
      createDefaultDate="2026-06-02"
      onModeChange={() => {}}
      onSaved={() => {}}
      onAfterDelete={() => {}}
      onDirtyChange={() => {}}
    />
  )
  expect(screen.getByLabelText(/title/i)).toHaveValue('')
})
```

**Step 2: Run tests to verify they fail**

```bash
bun run test -- SessionPanel
```

Expected: FAIL — edit/create modes render the empty state.

**Step 3: Port form from `SessionEditor.tsx`**

Move the entire form body into a `<FormMode>` component inside `SessionPanel.tsx`. Keep:

- `FormState` interface (unchanged)
- `emptyForm()` and `fromSession()` helpers (unchanged)
- All validation booleans (`titleOk`, `dateOk`, `startFmtOk`, `endTimeOk`, `capacityOk`, `canSubmit`)
- `touched` Set + `attempted` boolean + `showErr()` helper
- `roomConflict` useMemo (unchanged — uses `composeTzIso` + `sessions` prop)
- `handleSubmit()` with `createSession` / `updateSession` calls and `router.refresh()`
- `<ModeToggle>` component (session/break switcher)

Wire into `SessionPanel`:

```typescript
if (mode === 'edit' && props.selectedSession) {
  return <FormMode {...props} session={props.selectedSession} isEdit />
}
if (mode === 'create') {
  return <FormMode {...props} session={null} isEdit={false} />
}
```

Layout differences from the old Dialog version:

- No `<DialogContent>` / `<DialogHeader>` / `<DialogFooter>` wrappers.
- Header: `<header className="p-6 pb-4 border-b">` with title and day subtitle (no close X — Cancel button in footer is enough).
- Body: `<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">` — gets the scroll, panel handles its own height.
- Sticky footer: `<footer className="px-6 py-3 border-t bg-muted/30 flex justify-end gap-2">` with `Cancel` + `Save/Add` buttons.

**After successful submit (unified pattern — applies to BOTH edit and create):**

Both paths call a single `onSaved(id: string)` prop on `SessionPanel`. `ScheduleEditor` stores it as `pendingSavedId`, watches the `sessions` prop in a `useEffect`, and when the matching row arrives via `router.refresh()` flips the panel to view mode against the fresh session reference. This avoids the stale-`selectedSession` bug that would otherwise show the pre-edit title until the user clicked the row again.

```typescript
// In FormMode:
async function handleSubmit() {
  if (!canSubmit) { setAttempted(true); return }
  if (pending) return
  setPending(true)
  try {
    const payload = /* build payload from form, same as SessionEditor.tsx */
    const result = isEdit
      ? await updateSession(session!.id, payload)
      : await createSession(payload)
    if (!result.success) {
      toast.error(result.error ?? 'Could not save session')
      return
    }
    toast.success(isEdit ? 'Session updated' : 'Session added')
    // 'id' on the create result, falls back to session.id for edit:
    const savedId = isEdit ? session!.id : (result as { id: string }).id
    onSaved(savedId)
    router.refresh()
  } finally {
    setPending(false)
  }
}
```

`friendlySessionError` in `client-actions.ts:173` already translates capacity-floor and end-after-start DB messages, so `toast.error(result.error)` shows readable text without extra translation work.

**Auto-focus on entry** (per Locked Decisions):
- Create mode: auto-focus the title input on first render.
- Edit mode: no auto-focus.

### Task 4b — Wire post-save reconciliation in `ScheduleEditor`

Add `onSaved` prop plumbing in `SessionPanel` Props interface and the `pendingSavedId` useEffect in `ScheduleEditor` (snippet lives in the audit section under "Resolved open question — post-save panel state"). Commit separately so the form port and the reconciliation pattern can be reviewed independently.

### Task 4c — Unsaved-changes guard

- Compute `isDirty` via `useMemo(() => !shallowEqual(form, initialForm), [form, initialForm])` and report upward via `onDirtyChange(isDirty)` in an effect.
- `ScheduleEditor` owns `panelIsDirty` + `pendingNav` and wraps every navigation trigger (row click, header "Add session", day "Add on …" button) in `attemptNav()`.
- The form footer's Cancel button bypasses the guard — explicit "I'm leaving."
- See Locked Decisions for the confirm-dialog snippet — uses `Dialog` (already in `src/components/ui/`).

**Prior art — `src/app/profile/components/UnsavedChangesModal.tsx`:** profile pages already implement an unsaved-changes modal with the same `Dialog`-based pattern. Read it before writing 4c — it confirms the primitive choice and shows one possible UX (Save / Don't save / Stay-via-overlay-click). Our case is simpler (Cancel / Discard, no "Save and leave") because the panel can't save in the background — but the modal shape and overlay-dismiss-equals-cancel convention should match.

**Step 4: Run tests to verify they pass**

```bash
bun run test -- SessionPanel
```

Expected: PASS for both new tests.

**Step 5: Manual smoke check** (do not commit until clean)

```bash
bun run dev
```

In a browser at a draft conference: confirm panel shows form when clicking Edit, fields prefill, validation fires on blur, save shows toast and switches back to view.

**Step 6: Commit each substep separately**

```bash
# After 4a (form port + submit):
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/components/SessionPanel.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/SessionPanel.test.tsx
git commit -m "feat(admin): port session edit/create form into SessionPanel"

# After 4b (onSaved + pendingSavedId reconciliation in ScheduleEditor):
# (ScheduleEditor still uses the old layout at this point; Task 6 rewrites it.
#  If 4b's wiring requires ScheduleEditor changes that don't slot into the old
#  file, defer 4b's commit into Task 6 instead of shipping a half-rewrite.)
git commit -m "feat(admin): reconcile post-save panel state via pendingSavedId"

# After 4c (isDirty + attemptNav + confirm dialog):
git commit -m "feat(admin): add unsaved-changes guard to session form"
```

---

## Task 5: Add inline delete confirmation mode

**Files:**
- Modify: `src/app/(app)/admin/conferences/[conferenceId]/components/SessionPanel.tsx`

**Step 1: Write failing test — delete mode requires typing "delete" to enable button**

```typescript
import { fireEvent } from '@testing-library/react'

it('disables delete button until the user types "delete"', () => {
  const session = makeSession()
  render(
    <SessionPanel
      conference={makeConference()}
      sessions={[session]}
      signupCounts={{}}
      checkInCounts={{}}
      mode="delete"
      selectedSession={session}
      createDefaultDate={undefined}
      onModeChange={() => {}}
      onSaved={() => {}}
      onAfterDelete={() => {}}
      onDirtyChange={() => {}}
    />
  )
  const btn = screen.getByRole('button', { name: /delete session/i })
  expect(btn).toBeDisabled()
  fireEvent.change(screen.getByLabelText(/type delete to confirm/i), {
    target: { value: 'delete' },
  })
  expect(btn).toBeEnabled()
})
```

**Step 2: Run test to verify it fails**

```bash
bun run test -- SessionPanel
```

Expected: FAIL.

**Step 3: Implement `DeleteMode`**

Add inside `SessionPanel.tsx`:

```typescript
function DeleteMode({
  session,
  signupCounts,
  checkInCounts,
  onModeChange,
  onAfterDelete,
}: { session: AdminSession; /* ... */ }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [pending, setPending] = useState(false)
  const enabled = confirm.trim().toLowerCase() === 'delete' && !pending
  const signups = signupCounts[session.id] ?? 0
  const checkIns = checkInCounts[session.id] ?? 0

  async function handleDelete() {
    if (!enabled) return
    setPending(true)
    try {
      const result = await deleteSession(session.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not delete')
        return
      }
      toast.success(session.is_break ? 'Break deleted' : 'Session deleted')
      onAfterDelete()
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-6 pb-4 border-b">
        <div className="text-xs uppercase tracking-widest text-destructive font-medium mb-2">
          Confirm delete
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          {session.is_break ? 'Delete this break?' : 'Delete this session?'}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Permanently removes <span className="text-foreground font-medium">&ldquo;{session.title}&rdquo;</span>
          {!session.is_break && (signups > 0 || checkIns > 0) && (
            <> and {signups} signup{signups === 1 ? '' : 's'}
              {checkIns > 0 && <>, {checkIns} check-in{checkIns === 1 ? '' : 's'}</>}
            </>
          )}. This cannot be undone.
        </p>
      </header>
      <div className="px-6 py-4 flex-1">
        <Label htmlFor="confirm-delete" className="text-xs">
          Type <span className="font-mono">delete</span> to confirm
        </Label>
        <Input
          id="confirm-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          aria-label="Type delete to confirm"
          className="mt-1 font-mono"
          autoFocus
        />
      </div>
      <footer className="px-6 py-3 border-t bg-muted/30 flex justify-end gap-2">
        <Button variant="ghost" size="sm" disabled={pending}
          onClick={() => onModeChange('view', session)}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" disabled={!enabled}
          onClick={handleDelete}>
          {pending ? 'Deleting…' : session.is_break ? 'Delete break' : 'Delete session'}
        </Button>
      </footer>
    </div>
  )
}
```

Wire into `SessionPanel`:

```typescript
if (mode === 'delete' && props.selectedSession) {
  return <DeleteMode {...props} session={props.selectedSession} />
}
```

**Step 4: Run test to verify it passes**

```bash
bun run test -- SessionPanel
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/components/SessionPanel.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/SessionPanel.test.tsx
git commit -m "feat(admin): add inline delete confirmation to SessionPanel"
```

---

## Task 6: Rewrite `ScheduleEditor.tsx` as split grid

**Files:**
- Modify: `src/app/(app)/admin/conferences/[conferenceId]/components/ScheduleEditor.tsx`
- Create: `src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/ScheduleEditor.test.tsx`

**Step 1: Write failing test — clicking a row selects it and opens the view panel**

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ScheduleEditor } from '../ScheduleEditor'
import type { ConferenceEditorView } from '../../../types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}))

const view: ConferenceEditorView = {
  conference: { /* ... */ },
  sessions: [{ id: 's1', title: 'Opening', /* ... */ }],
  signupCounts: { s1: 0 }, checkInCounts: { s1: 0 },
  feedbackBySession: {}, invitedCount: 0, feedbackCount: 0,
  attendees: { people: [], filterCategories: [], invitedUserIds: [] },
}

it('opens view panel when a row is clicked', () => {
  render(<ScheduleEditor view={view} />)
  fireEvent.click(screen.getByRole('button', { name: /opening/i }))
  // After click, "Select a session" empty-state should be gone.
  expect(screen.queryByText(/select a session/i)).not.toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

```bash
bun run test -- ScheduleEditor
```

Expected: FAIL — current implementation opens a Sheet, not a panel.

**Step 3: Rewrite `ScheduleEditor.tsx`**

Replace the file with the split-grid implementation:

```typescript
'use client'

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react'
import { Calendar, Coffee, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { decomposeTzIso } from '../../lib/datetime'
import { SessionPanel, type PanelMode } from './SessionPanel'
import type { AdminSession, ConferenceEditorView } from '../../types'

export interface ScheduleEditorHandle {
  openCreate: (date?: string) => void
}

interface Props {
  view: ConferenceEditorView
}

export const ScheduleEditor = forwardRef<ScheduleEditorHandle, Props>(
  function ScheduleEditor({ view }, ref) {
    const { conference, sessions, signupCounts, checkInCounts } = view

    const [mode, setMode] = useState<PanelMode>('empty')
    const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null)
    const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>()

    useImperativeHandle(ref, () => ({
      openCreate(date) {
        setSelectedSession(null)
        setCreateDefaultDate(date)
        setMode('create')
      },
    }), [])

    const groupedDays = useMemo(
      () => groupByDay(sessions, conference.timezone),
      [sessions, conference.timezone]
    )

    function selectSession(s: AdminSession) {
      setSelectedSession(s)
      setMode('view')
    }

    function changeMode(nextMode: PanelMode, session?: AdminSession | null) {
      setMode(nextMode)
      if (session !== undefined) setSelectedSession(session)
    }

    function afterDelete() {
      setSelectedSession(null)
      setMode('empty')
    }

    // Zero-session conferences: show ONLY the conference-level empty state until
    // the user clicks "Add first" — then render the full split grid so create
    // mode has the right chrome. Do NOT render SessionPanel here while mode is
    // 'empty', or its own "Select a session" empty state will stack below the
    // conference one.
    if (sessions.length === 0 && mode !== 'create') {
      return (
        <div className="py-8">
          <EmptyConferenceState onAdd={() => {
            setCreateDefaultDate(conference.start_date)
            setMode('create')
          }} />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 min-h-[640px] border rounded-lg overflow-hidden">
        <div className="border-r overflow-y-auto bg-muted/40">
          {groupedDays.map(({ date, sessions: daySessions }) => (
            <section key={date} className="pb-4 [&:not(:first-child)]:pt-2">
              <div className="px-6 pt-5 pb-3 sticky top-0 bg-muted/40 backdrop-blur z-10 flex items-baseline gap-2.5">
                <h2 className="text-[13px] font-semibold tracking-tight">
                  {format(parseISO(date), 'EEEE, MMMM d')}
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {summarizeDay(daySessions)}
                </span>
              </div>
              <div className="px-[18px] flex flex-col gap-1.5">
                {daySessions.map((s) => (
                  <SessionRow
                    key={s.id} session={s} timezone={conference.timezone}
                    selected={selectedSession?.id === s.id}
                    signupCount={signupCounts[s.id] ?? 0}
                    checkInCount={checkInCounts[s.id] ?? 0}
                    onSelect={() => selectSession(s)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSession(null)
                  setCreateDefaultDate(date)
                  setMode('create')
                }}
                className="mx-[18px] mt-2.5 w-[calc(100%-36px)] rounded-md border border-dashed px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-card hover:border-muted-foreground/60 inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add on {format(parseISO(date), 'EEEE')}
              </button>
            </section>
          ))}
        </div>
        <div className="bg-background flex flex-col">
          <SessionPanel
            conference={conference} sessions={sessions}
            signupCounts={signupCounts} checkInCounts={checkInCounts}
            mode={mode} selectedSession={selectedSession}
            createDefaultDate={createDefaultDate}
            onModeChange={changeMode} onAfterDelete={afterDelete}
          />
        </div>
      </div>
    )
  }
)

// SessionRow, EmptyConferenceState, groupByDay, summarizeDay, formatTime — port from old file.
```

**SessionRow layout (per prototype):**

```tsx
function SessionRow({ session, selected, signupCount, checkInCount, ...}: ...) {
  if (session.is_break) {
    return (
      <button onClick={onSelect} className={cn(
        'flex items-center min-h-[48px] rounded-lg border border-dashed transition-colors text-left',
        selected ? 'bg-muted border-border opacity-100' : 'border-border bg-transparent opacity-85 hover:bg-card hover:border-muted-foreground/60'
      )}>
        <div className="w-[30px] h-[30px] rounded-full border bg-background ml-4 my-3 flex items-center justify-center text-muted-foreground shrink-0">
          <Coffee className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 px-3.5">
          <div className="text-[13px] font-medium truncate">{session.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {formatTimeRange(startWall, endWall)}{session.room && ` · ${session.room}`} · break
          </div>
        </div>
      </button>
    )
  }
  return (
    <button onClick={onSelect} className={cn(
      'flex items-stretch min-h-[60px] rounded-lg border bg-card transition-colors text-left overflow-hidden',
      selected ? 'bg-muted border-border' : 'border-transparent hover:bg-muted/60 hover:border-border/60'
    )}>
      <div className="font-mono text-[10.5px] text-muted-foreground w-[62px] py-3.5 px-2.5 pl-4 text-right leading-tight flex flex-col justify-center shrink-0">
        <div>{startWall}</div>
        <div className="opacity-70">{endWall}</div>
      </div>
      <div className="w-px bg-border/50 my-2.5" />
      <div className="flex-1 min-w-0 px-3.5 py-3.5 flex flex-col justify-center">
        <div className="text-[13px] font-medium truncate">{session.title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {[session.speaker, session.room].filter(Boolean).join(' · ')}
        </div>
      </div>
      {session.capacity != null && (
        <div className="flex items-center gap-2 px-4 shrink-0">
          <RowStat value={`${signupCount}/${session.capacity}`} label={isFull ? 'Full' : 'Signed up'} tone={isFull ? 'destructive' : 'default'} />
          <RowStat value={checkInCount === 0 ? '—' : String(checkInCount)} label="Checked in" tone={checkInCount === 0 ? 'muted' : 'default'} />
        </div>
      )}
    </button>
  )
}
```

> **Naming note:** `RowStat` (local to `ScheduleEditor.tsx`) is intentionally separate from `Stat` (local to `SessionPanel.tsx`, Task 2) because the row variant has a `tone` prop for full/muted states and the panel variant doesn't. If a third caller appears later, extract a shared `<StatCell>` per the CLAUDE.md reuse rule.

**Row state tiers** (must read as three distinct levels):
1. Idle: white card on muted pane
2. Hover: `bg-muted/60` — slight lift from pane background
3. Selected: `bg-muted border-border` — darker fill + visible border, **no** brand color / no text recolor / no rail

**Unsaved-changes plumbing + post-save reconciliation** (per Locked Decisions):

```typescript
const [panelIsDirty, setPanelIsDirty] = useState(false)
const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)
const [pendingSavedId, setPendingSavedId] = useState<string | null>(null)

function attemptNav(action: () => void) {
  if (panelIsDirty) setPendingNav(() => action)
  else action()
}

// Reconcile: after save, router.refresh() repopulates `sessions`. When the
// matching row arrives, flip the panel to view mode with the fresh reference.
useEffect(() => {
  if (!pendingSavedId) return
  const fresh = sessions.find((s) => s.id === pendingSavedId)
  if (fresh) {
    setSelectedSession(fresh)
    setMode('view')
    setPendingSavedId(null)
  }
}, [sessions, pendingSavedId])

// Pass to SessionPanel:
<SessionPanel
  ...
  onSaved={(id) => setPendingSavedId(id)}
  onDirtyChange={setPanelIsDirty}
  onModeChange={changeMode}
/>

// Wrap nav triggers:
<SessionRow onSelect={() => attemptNav(() => selectSession(s))} ... />
// "Add on day" button → attemptNav(() => { setMode('create'); ... })
// Header "Add session" button (via ref) → also attemptNav

// Discard-changes dialog (uses the existing Dialog primitive — see Locked
// Decisions for the rationale on Dialog vs alert-dialog shadcn primitive):
<Dialog open={pendingNav !== null} onOpenChange={(open) => !open && setPendingNav(null)}>
  <DialogContent className="sm:max-w-[420px]">
    <DialogHeader>
      <DialogTitle>Discard unsaved changes?</DialogTitle>
      <DialogDescription>
        Your edits will be lost. This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={() => setPendingNav(null)}>Cancel</Button>
      <Button variant="destructive" onClick={() => { pendingNav?.(); setPendingNav(null) }}>
        Discard changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

The imperative `openCreate()` exposed to `ConferenceEditor` (Task 7) must also route through `attemptNav` — otherwise the header button bypasses the guard. The cleanest way: have `openCreate` on the handle call `attemptNav` internally rather than expecting `ConferenceEditor` to know about the guard.

**Step 4: Run test to verify it passes**

```bash
bun run test -- ScheduleEditor
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/components/ScheduleEditor.tsx \
        src/app/\(app\)/admin/conferences/\[conferenceId\]/components/__tests__/ScheduleEditor.test.tsx
git commit -m "feat(admin): rewrite ScheduleEditor as master-detail split grid"
```

---

## Task 7: Wire `openCreate()` from header

**Files:**
- Modify: `src/app/(app)/admin/conferences/[conferenceId]/ConferenceEditor.tsx`

**Step 1: Add ref + button (no test — pure wiring)**

Edit `ConferenceEditor.tsx`:

1. Import `useRef`, `Plus` icon, and the handle type:

```typescript
import { useRef, useState } from 'react'
import { Plus, Calendar as CalendarIcon, ChevronLeft, MapPin } from 'lucide-react'
import { ScheduleEditor, type ScheduleEditorHandle } from './components/ScheduleEditor'
```

2. Create the ref:

```typescript
const scheduleRef = useRef<ScheduleEditorHandle>(null)
```

3. Render the button inside the existing header `<div className="flex items-center gap-2 shrink-0">` block. Place **before** the `{isDraft && <Tooltip>...Go Live...</Tooltip>}` so the order is `Add session` then `Go Live`:

```tsx
<Button
  variant="outline"
  onClick={() => scheduleRef.current?.openCreate()}
>
  <Plus className="w-4 h-4" />
  Add session
</Button>
```

4. Pass the ref to `<ScheduleEditor>`:

```tsx
<TabsContent value="schedule" className="py-6">
  <ScheduleEditor ref={scheduleRef} view={initialView} />
</TabsContent>
```

**Step 2: Manual smoke test**

```bash
bun run dev
```

Open a draft conference. Click "Add session" in the header — the right panel should switch into create mode with day pre-selected to `conference.start_date`. Confirm "Go Live" button still renders alongside.

**Step 3: Type-check**

```bash
bunx tsc --noEmit
```

Expected: clean.

**Step 4: Commit**

```bash
git add src/app/\(app\)/admin/conferences/\[conferenceId\]/ConferenceEditor.tsx
git commit -m "feat(admin): add header Add session button wired to ScheduleEditor.openCreate"
```

---

## Task 8: Delete `SessionEditor.tsx` and `RosterSheet.tsx`

**Files:**
- Delete: `src/app/(app)/admin/conferences/[conferenceId]/components/SessionEditor.tsx`
- Delete: `src/app/(app)/admin/conferences/[conferenceId]/components/RosterSheet.tsx`

**DO NOT DELETE** (per audit):
- `SessionCommentsSheet.tsx` — used by `AdminFeedbackTab`, unrelated to schedule
- `TypeToConfirmDialog.tsx` — still used by `ConferenceEditor` for conference-delete
- `useBottomSheetDragToDismiss` / `useIsMobile` — still used by `SessionCommentsSheet`

**Step 1: Confirm no other importers**

```bash
grep -rn "from.*SessionEditor\|from.*RosterSheet" src/
```

Expected: zero matches. The new `ScheduleEditor.tsx` no longer imports either, and the files themselves don't self-import.

**Step 2: Delete**

```bash
rm src/app/\(app\)/admin/conferences/\[conferenceId\]/components/SessionEditor.tsx
rm src/app/\(app\)/admin/conferences/\[conferenceId\]/components/RosterSheet.tsx
```

**Step 3: Type-check + tests + lint**

```bash
bun run lint && bunx tsc --noEmit && bun run test
```

Expected: all clean.

**Step 4: Commit**

```bash
git add -u src/
git commit -m "chore(admin): remove obsolete SessionEditor dialog and RosterSheet"
```

---

## Task 9: Manual QA pass

**Files:** none (no code changes; capture issues as follow-up commits if found)

Walk through every panel state on a real conference. Use these scripts in the browser:

| Scenario | Expected |
|---|---|
| Open draft conference with sessions | Left list populated, right panel shows "Select a session" empty state |
| Click a session row | Left row highlighted, right panel shows view mode + roster loading → roster list |
| Click a break row | Right panel shows break view (no roster section, just header + footer with Edit/Delete) |
| Click "Edit" in panel footer | Same panel switches to edit form, fields prefilled |
| Edit + Save | Toast, panel returns to view, left row updates |
| Click "Add session" in header | Panel switches to create form, day = conference start date |
| Click "Add on <day>" in left list | Create form opens with that day pre-selected |
| Submit create | Toast, panel returns to empty (or view of new session — pick one, document) |
| Click "Delete" in panel footer | Panel switches to delete confirm, type "delete", click Delete, row disappears, panel → empty |
| Switch tabs Info ↔ Schedule | Schedule tab remembers selected session and mode |
| Resize browser below 1024px | Grid does not break; document if mobile is intentionally unsupported |
| Past conference (status='past') | Panel still works for view, but consider hiding Edit/Delete (out of scope — file an issue) |
| Toggle dark mode while a row is selected | Selected row (`bg-muted`) must still read as distinct from idle (`bg-card`). `--muted` and `--card` are visually close in dark mode — if the selection signal is illegible, escalate before merge (either bump `bg-muted` weight or add `ring-1 ring-border` to selected). |
| Empty conference (no sessions) | Page shows ONLY the "No sessions yet [Add first session]" empty state — no "Select a session" panel stacked below it. |
| Save edit in view mode | After `router.refresh()` lands, the panel shows the **updated** title/time without needing to re-click the row (verifies `pendingSavedId` reconciliation). |

**Step 1: Delete prototype HTML files**

```bash
rm admin-schedule-ux-prototype.html admin-schedule-ux-v2.html
git add -u
git commit -m "chore: remove admin schedule UX prototype HTML files"
```

**Step 2: Final CI commands locally**

```bash
bun run lint && bunx tsc --noEmit && bun run test && bun run build
```

Expected: all green.

**Step 3: Push and open PR**

```bash
git push -u origin feat/admin-rebuild
gh pr create --title "feat(admin): rebuild conference schedule editor as master-detail split panel" --body "..."
```

PR body should include: prototype reference, list of files added/removed, screenshot of the new layout, manual QA checklist results.

---

## Locked Decisions (post-clarification, 2026-05-19)

These were open questions resolved by the product owner during plan review. Treat as binding for execution.

### Unsaved-changes guard (modal pattern)

When the user has a dirty edit/create form and tries to navigate away, intercept with a modal:

```typescript
"Discard unsaved changes?"
"Your changes to "<session title>" will be lost. This cannot be undone."
[ Cancel ]  [ Discard changes ]  // destructive
```

**Component choice — `Dialog` (locked):** The shadcn `alert-dialog` primitive is not currently installed in this repo (`src/components/ui/` has `alert.tsx` and `dialog.tsx` only). Use the existing `Dialog` primitive — same modal behavior, two-button footer pattern matches `TypeToConfirmDialog.tsx`. Decision rationale: the semantic upside of `AlertDialog` (role="alertdialog", required choice, no overlay-click dismissal) is too small for a single discard-confirm to justify adding a primitive.

**Triggers** (only when `isDirty === true`):
- Clicking a different session/break row in the left list
- Clicking the header "Add session" button
- Clicking an "Add on <day>" button in any day group
- (Cancel button in the form footer does **not** trigger the dialog — it's already an explicit "I'm leaving" action; just discard silently.)

**`isDirty` definition**: shallow-compare current `form` state to `initialForm`. Use a `useMemo` to derive — don't track edits separately, that gets out of sync.

**Implementation sketch** (lives in `SessionPanel.tsx`):

```typescript
const [pendingNav, setPendingNav] = useState<(() => void) | null>(null)
const isDirty = useMemo(() => !shallowEqual(form, initialForm), [form, initialForm])

function attemptNav(navAction: () => void) {
  if (isDirty) setPendingNav(() => navAction)
  else navAction()
}

// Parent calls `attemptNav(() => onModeChange('view', otherSession))` instead of `onModeChange` directly.
// AlertDialog wired to `pendingNav !== null`. On confirm: pendingNav(); setPendingNav(null).
```

The cleanest way to plumb this: lift `attemptNav` to `ScheduleEditor` (it owns the panel state), let `SessionPanel` expose its `isDirty` flag upward via a ref or callback. Pick whichever feels less convoluted at implementation time.

### Auto-focus on form entry

- **Create mode**: auto-focus the **title** input. Use `autoFocus` on the Input or a `useEffect(() => inputRef.current?.focus(), [])` if Radix swallows the prop.
- **Edit mode**: **do not** auto-focus. User is more likely scanning existing values; pulling focus to title disrupts that.
- **Delete mode**: auto-focus the confirm input (already in the plan).

### `loadRoster` extraction

Move out of `SessionPanel.tsx` into its own file:

```
src/app/(app)/admin/conferences/[conferenceId]/components/loadRoster.ts
src/app/(app)/admin/conferences/[conferenceId]/components/__tests__/loadRoster.test.ts
```

Export signature unchanged: `loadRoster(sessionId): Promise<{ entries, error: null } | { entries: [], error: string }>`. Mock the Supabase client in the test; assert the merge (signups + check-ins on user_id) and sort (checked-in first by time, others by name).

**Why extract:** `SessionPanel` will be large with five modes + form state + roster filter/search; pulling out the pure data-merging logic shrinks the component and makes the most testable thing in the rebuild testable in isolation.

### Branch name

`feature/admin-rebuild` (locked). Aligns with CLAUDE.md's `feature/*` convention; earlier `feat/admin-rebuild` was non-binding.

### Stale plan reference

`docs/plans/2026-04-25-conference-staged-build.md` is stale per product owner. The "Stage N" comments in `RosterSheet.tsx` (deleted in Task 8) and elsewhere can be ignored. No need to reconcile this PR with that plan.

---

## Audit Against Current Admin View (2026-05-19)

Verified the plan against the working tree before execution. Findings:

### Confirmed safe — no plan changes needed

- **`page.tsx`**: server component, calls `requireAdmin()` + `getConferenceEditorView()`, sets `dynamic = 'force-dynamic'`. `router.refresh()` from our client mutations will actually re-fetch. ✓
- **`data.ts` returns the exact shape the plan assumes**: `signupCounts`/`checkInCounts` keyed by session_id, `sessions` ordered by `start_at`, full `AdminSession` shape including `check_in_code`. ✓
- **`client-actions.ts` `createSession`/`updateSession`/`deleteSession` signatures match**: `createSession` returns `{success:true, id:string}`, others return `SimpleResult`. ✓
- **`friendlySessionError` already translates DB errors** before they hit the UI. The plan's `toast.error(result.error)` calls will show readable text for capacity-violation and time-order errors without extra translation work. ✓
- **Toast system**: Sonner mounted globally at `top-center` per `src/app/layout.tsx`. ✓
- **Auth**: server-side in `page.tsx`. No client-side guards needed in `SessionPanel`/`ScheduleEditor`. ✓

### Files explicitly NOT touched by this rebuild

- **`SessionCommentsSheet.tsx`** — the feedback drill-down used only by `AdminFeedbackTab.tsx`. Sits in the same `components/` folder as `RosterSheet.tsx` and `SessionEditor.tsx`. **Do not delete.** It is wired into the Feedback tab, not the Schedule tab.
- **`TypeToConfirmDialog.tsx`** — still imported by `ConferenceEditor.tsx` for the conference-level delete (type the conference name). Only its *usage inside `ScheduleEditor.tsx`* is removed. The component file stays.
- **`useBottomSheetDragToDismiss` + `useIsMobile`** — still consumed by `SessionCommentsSheet`. Don't delete the hooks even though `RosterSheet` will no longer use them.
- **`AdminFeedbackTab.tsx`** — opens `SessionCommentsSheet` from the feedback list. Unrelated to schedule.

### Resolved open question — post-save panel state (covers BOTH edit and create)

Both edit and create funnel through one `onSaved(id)` callback. `createSession` returns `{success: true, id}`; for edit we already have `session.id`. `ScheduleEditor` stores it as `pendingSavedId` and reconciles against the next `sessions` prop update from `router.refresh()`. This unifies the two paths and avoids the stale-`selectedSession` bug that would otherwise show the pre-edit title until the user clicked the row again.

```typescript
// In FormMode (SessionPanel) — single submit handler for both modes:
async function handleSubmit() {
  /* validation + payload build, then: */
  const result = isEdit
    ? await updateSession(session!.id, payload)
    : await createSession(payload)
  if (!result.success) { toast.error(result.error); return }
  toast.success(isEdit ? 'Session updated' : 'Session added')
  const savedId = isEdit ? session!.id : (result as { id: string }).id
  onSaved(savedId)
  router.refresh()
}

// In ScheduleEditor — one effect handles both paths:
const [pendingSavedId, setPendingSavedId] = useState<string | null>(null)
useEffect(() => {
  if (!pendingSavedId) return
  const fresh = sessions.find((s) => s.id === pendingSavedId)
  if (fresh) {
    setSelectedSession(fresh)
    setMode('view')
    setPendingSavedId(null)
  }
}, [sessions, pendingSavedId])
```

### Capacity-floor validation surface

`friendlySessionError` translates `Cannot reduce capacity below current signup count` into a readable message but it's a *validation* error tied to the capacity field, not a system error. Current `SessionEditor.tsx` toasts it — for parity, keep toasting in the new `SessionPanel`. Filing a follow-up to surface this inline on the capacity input is out of scope for this PR.

### Viewport math at 1280px

Content area inside `px-6 md:px-8` and `Tabs` chrome ≈ 1216px. With `grid-cols-2`: each pane ≈ 600px (after the 1px border). Forms fit comfortably; roster fits with the search input + filter tabs + attendee rows. Below 1024px the grid breaks — acceptable per the desktop-only admin constraint. Add a `lg:grid grid-cols-1 lg:grid-cols-2` guard with a "Use a larger screen" fallback or omit it; defer to QA.

### Header collision when conference is `draft`

`ConferenceEditor.tsx:124` is a `flex items-center gap-2 shrink-0` block. Adding "Add session" before "Go Live" gives two buttons. Both have `flex-wrap` on the parent header — they'll stack at very narrow widths. Verify visually during Task 7.

---

## Remaining Open Questions

1. **Past conferences:** should Edit/Delete still be available? Not in scope for this PR — keep current behavior (allowed). File a follow-up issue.
2. **Mobile breakpoint:** prototype is desktop-only (≥1024px). Below that, grid columns collapse and UX breaks. Acceptable per user's "desktop-only admin" constraint — add a `hidden lg:grid` guard with a "Use a larger screen" fallback if we want it explicit. Defer to QA pass.
3. **Capacity-floor inline error:** currently toasted. File a follow-up to surface inline on the capacity field if user feedback warrants.

---

## Notes on Style Compliance

- All copy in lowercase-sentence-case (matches existing admin chrome).
- No emojis anywhere in code or commits.
- Lucide icons only.
- Design tokens only (`bg-muted/20`, `border-primary`, etc.) — no arbitrary colors.
- shadcn primitives used: `Button`, `Input`, `Label`, `Select`, `Tabs`, `Textarea`.
- `toast.success` / `toast.error` from Sonner (already global).
- Component padding stays at `p-6` for header/footer blocks.
- Tests follow vitest + RTL pattern from existing `*.test.ts` files in `src/app/(app)/admin/conferences/lib/__tests__/`.
