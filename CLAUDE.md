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
- **New button styles → add a CVA variant in `button.tsx`, don't inline raw `<button>` + Tailwind.** Same rule for any `cva`-driven primitive (badge, alert, etc.). One source of truth → consistent affordance language across the app + TypeScript autocomplete on variant names. Existing button variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `link-destructive`.
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
