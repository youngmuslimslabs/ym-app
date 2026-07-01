# YM App - Claude Code Rules

## Stack
- Next.js 15.5.7 (App Router), React 19, TypeScript (strict), Tailwind CSS 3, shadcn/ui (new-york style)
- Supabase (Auth + Database), Google OAuth
- **Package manager: Bun** (`bun install`, `bun run dev`, `bun run build`)

## Code Conventions
- Always TypeScript, `@/*` path alias → `./src/*`
- `interface` for objects, `type` for unions/intersections
- Server Components by default, `'use client'` only when needed
- Extract primitive values for useEffect deps to prevent infinite loops
- Absolute imports ordered: React/Next → external → internal → types

## UI & Design System
- **shadcn/ui first** — only create custom components if shadcn doesn't have it
- **Icons: lucide-react only** — never `@radix-ui/react-icons` or `react-icons`
- **Only design system colors** — never arbitrary colors (`bg-amber-500`, etc.)
- **Search before creating components** — Before writing any new component, grep the codebase for one that already does the job, or one you can extend with a prop/variant. Only create a new component if (a) no existing one fits AND (b) no existing one can be extended cleanly. Examples: people-table-with-selection → extend `PeopleTable` with a `selection` prop, don't write a `PickerTable`. New button style → add a CVA variant in `button.tsx`, don't fork.
- **Reuse is a component, not a copy-paste** — add a variant to an existing CVA primitive when it fits, otherwise extract a new component before the second caller appears.
- **Notifications: use Sonner via `import { toast } from 'sonner'`** — never inline status strips inside Sheets/Dialogs. Toaster is mounted globally in `src/app/layout.tsx` at `top-center`. Inline error chrome (e.g., destructive border around a wrong-input field) is the right pattern for validation correction; toasts are for transient confirmations and unexpected errors.
- OKLCH color tokens in CSS variables, Tailwind wraps with `oklch(var(...) / <alpha-value>)`
- Sidebar tokens use HSL (separate system from main OKLCH tokens)
- Brand color: `#254FA0` → `oklch(0.445 0.14 261.872)` light, `oklch(0.65 0.14 261.872)` dark
- Animations: `duration-200` standardized across custom components (shadcn primitives keep their own timing)
- Card padding: `p-6`. Empty states: Lucide icon in `rounded-full bg-muted/50 p-4`, no emojis, no CTAs
- Responsive: test at 375px, 393px, 430px, 1280px+

### ExpandableCard Sections (Roles, Projects, Education)
All profile list sections use `ExpandableCardList` → `ExpandableCard` and must stay consistent:
- **Badge text**: Always `"Current"` (never "Active" or other variants)
- **Subtitle separator**: `•` (U+2022 BULLET) via `parts.join(' • ')`
- **Read-only fields**: Key identifying fields always show with `'—'` dash fallback. Description/notes only shown if content exists.
- **Section descriptions**: "Your [noun]" in edit mode, drop "Your" in read-only
- **Empty state**: Only in read-only mode (`!isEditable`). Edit mode shows just the "Add" button.

## State Management
- **React Context** for multi-page state (OnboardingContext)
- **React Context** for cross-sibling mode flags on a single page — see `ProfileModeContext` (`isEditable`) used by `/profile` (edit) and `/people/[id]` (read-only). Prefer this over prop-drilling a flag through every section component.
- **Custom Hooks** for single-page form state (useProfileForm)
- Server Components + prop drilling for simple cases

## Supabase Patterns

**Resolve FK display names at query level — never do a second client-side fetch:**
```typescript
// ✅ Join in .select() so names arrive with the data
.select('*, role_types(name), amir_user:users!fk_name(first_name, last_name)')
// ❌ Fetching UUIDs then resolving with a second query
```

**Read-only vs edit mode:** Read-only components use pre-resolved names (zero extra fetches). Edit mode fetches dropdown options behind `if (!isEditable) return`.

**Safe writes — insert-first-then-delete, never delete-all-then-insert:**
```typescript
// 1. Get existing IDs → 2. Insert new → 3. Delete old (only after success)
```

**Use `.maybeSingle()` not `.single()`** when 0 or >1 results are possible.

**DB functions return `{ success: boolean; error?: string }`** — distinguish "not found" vs "connection error", never fail silently.

**Migrations:** `supabase/migrations/XXXXX_name.sql`, apply with `supabase db push`. Use unique constraints to prevent race conditions.

**Auth is Google Identity Services (`signInWithIdToken`), NOT an OAuth redirect flow.** Login = `GoogleSignInButton` (client-side ID-token JWT) → `signInWithIdToken`. The Google Cloud setting that matters is **Authorized JavaScript origins**, not redirect URIs — `redirect_uri_mismatch` cannot occur in this flow. `/auth/callback/route.ts` (`exchangeCodeForSession`) is **dead code** today (nothing links it); it only activates if you enable email confirmations/magic links — at which point `trailingSlash: true` starts mattering for that route.

## PostHog Patterns

- **Route handlers must `await getPostHogServer().flush()` before returning** — Netlify freezes the process after response; unflushed events are lost. (`logger` uses `SimpleLogRecordProcessor` — synchronous, no flush needed.)
- **Wrap every PostHog/logger call in its own try/catch inside error handlers** — observability must never affect the request path or suppress a `{ success: false }` return.
- **No PII in event properties or log bodies** — only counts, booleans, IDs, error messages, and path strings. Never query text, filter values, phone numbers, or email addresses.

## Git
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- **NEVER include Claude as co-author or add AI-generated footers**
- Branches: `main` is the integration branch; cut `feature/*` from `main` and merge back to `main`
- Pre-prod, no `dev` or staging branch — revisit when we go to production
- Always verify current branch before making edits

## CI/CD
- CI: `.github/workflows/ci.yml` — lint → type-check → build
- Netlify: `netlify.toml` — keep `BUN_VERSION` in sync with CI
- Type-check: `bunx tsc --noEmit`
