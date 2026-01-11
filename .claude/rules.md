# YM App - Claude Code Rules

## Technology Stack
- Next.js 15.5.3 (App Router) + React 19.1.0
- TypeScript 5.x (strict mode)
- Tailwind CSS 3.4.17 + shadcn/ui
- Supabase (Auth + Database)
- **Bun** for package management (`bun install`, `bun run dev`, `bun run build`)

## Code Style & Conventions

### TypeScript
- Always use TypeScript (no `.js`/`.jsx`)
- Explicit return types for exported functions
- `interface` for objects, `type` for unions/intersections
- Path alias: `@/*` → `./src/*`

### React & Next.js
- Use App Router (`src/app/`)
- Server Components by default, `'use client'` only when needed (hooks, events, browser APIs)
- File conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Props interface above component, use destructuring

**useEffect dependencies - use primitives to prevent infinite loops:**
```typescript
// ✅ Extract primitive value before useEffect
const userId = user?.id
useEffect(() => {
  if (!userId) return
  fetchData(userId)
}, [userId])  // Primitive string - stable reference

// ❌ Object dependency can cause infinite re-renders
useEffect(() => {
  if (!user?.id) return
  fetchData(user.id)
}, [user?.id])  // May create new reference each render
```

### UI Components (shadcn/ui)
1. **Check shadcn first**: https://ui.shadcn.com/docs/components
2. Install: `npx shadcn@latest add [component]`
3. Import: `import { Button } from "@/components/ui/button"`
4. Components go in `src/components/ui/`
5. Use `cn()` from `@/lib/utils` for className merging
6. Only create custom components if shadcn doesn't have it

### Icons
- **Use lucide-react exclusively** - this is the shadcn/ui standard
- Import: `import { IconName } from "lucide-react"`
- Browse icons: https://lucide.dev/icons
- Standard sizing: `className="h-4 w-4"` (small), `className="h-5 w-5"` (medium)
- ❌ Do NOT use `@radix-ui/react-icons`, `react-icons`, or other icon libraries

### Styling & Design System

#### Color Palette (STRICTLY USE THESE)
Only use the design system colors - NEVER introduce custom colors:
- `bg-background` / `text-foreground` - main background/text
- `bg-primary` / `text-primary-foreground` - buttons, icons, emphasis
- `bg-secondary` / `text-secondary-foreground` - secondary actions
- `bg-muted` / `text-muted-foreground` - subtle backgrounds, helper text
- `bg-accent` / `text-accent-foreground` - hover states
- `bg-destructive` / `text-destructive-foreground` - errors, danger actions
- `bg-card` / `text-card-foreground` - card backgrounds
- `border-border` / `border-input` - borders
- `ring-ring` - focus rings

#### Typography
- **Font**: Geist Sans (`font-sans`), Geist Mono for code (`font-mono`)
- Use Tailwind's type scale: `text-sm`, `text-base`, `text-lg`, `text-xl`, etc.
- Font weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- Letter spacing: `tracking-tight` for headings

#### Spacing & Layout
- Use Tailwind spacing scale (p-4, gap-6, etc.)
- Mobile-first responsive: `sm:`, `md:`, `lg:` breakpoints
- Standard padding: `p-6` for page containers
- Consistent gaps: `gap-2` (tight), `gap-4` (normal), `gap-6` (spacious)

#### Form Sections
- Section headings: `text-xl font-semibold tracking-tight text-foreground`
- Form field layout: `flex flex-col gap-1.5` with shadcn `Label`
- Section spacing: `space-y-5`
- Use shadcn `Badge` for counters/indicators

#### Responsive Testing
Test at these breakpoints:
- **Small iOS**: 375px (iPhone SE / Mini)
- **Standard iOS**: 393px (iPhone 16)
- **Large iOS**: 430px (iPhone 16 Pro Max)
- **Desktop**: 1280px+

#### Glassmorphism (use sparingly)
- Only for overlays and floating elements, not general containers
- Pattern: `bg-background/95 backdrop-blur-sm` (subtle, not heavy)
- Examples: dialog overlays, floating save bars, command palettes

#### Animations (keep subtle)
- Transitions: `transition-all duration-300` or `duration-500`
- Hover effects: `hover:scale-[1.02]`, `hover:bg-accent`
- Entry animations: opacity + translate with staggered delays

#### ❌ DO NOT
- Use arbitrary colors (e.g., `bg-amber-500`, `text-orange-600`)
- Add gradient backgrounds unless part of design system
- Use colors not in the design system palette
- Add decorative patterns or textures
- Import external fonts beyond Geist

### State Management
- **React Context** - Multi-page state that persists across routes (e.g., OnboardingContext)
- **Custom Hooks** - Single-page form state that resets on unmount (e.g., useProfileForm)
- Server Components + prop drilling for simple state
- Server Actions for mutations

### Authentication & Supabase
- Supabase client: `@/lib/supabase`
- Auth context: `@/contexts/AuthContext`
- Middleware handles redirects: `src/middleware.ts`
- Primary auth: Google OAuth
- Always handle loading/error states

### File Organization
```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── auth/        # Auth-related components
├── contexts/        # React contexts
├── lib/             # Utility functions and configurations
└── middleware.ts    # Next.js middleware
```

### Database Operations

**✅ Correct - Insert-First-Then-Delete Pattern:**
```typescript
// 1. Get existing record IDs
const { data: existing } = await supabase.from('table').select('id').eq('user_id', userId)
const existingIds = existing.map(r => r.id)

// 2. Insert new records FIRST
const { error } = await supabase.from('table').insert(newRecords)
if (error) return { success: false, error: 'Failed to save' }

// 3. Only delete old records AFTER successful insert
if (existingIds.length > 0) {
  await supabase.from('table').delete().in('id', existingIds)
}
```

**✅ Correct - Upsert Pattern (when applicable):**
```typescript
const { error } = await supabase
  .from('table')
  .upsert(records, { onConflict: 'user_id' })
```

**❌ NEVER - Delete-All-Then-Insert:**
```typescript
// DANGEROUS: If insert fails after delete, all data is lost permanently
await supabase.from('table').delete().eq('user_id', userId)
await supabase.from('table').insert(newRecords) // ← Network error here = data loss
```

### Supabase Query Patterns

**Use `.maybeSingle()` for safer error handling:**
```typescript
// ✅ Graceful handling of 0 or >1 results
const { data, error } = await supabase
  .from('memberships')
  .select('id')
  .eq('user_id', userId)
  .maybeSingle()

if (error) {
  // Handle actual errors
  return { success: false, error: 'Database error' }
}

if (data) {
  // Update existing
} else {
  // Create new
}
```

**❌ Avoid `.single()` when multiple results possible:**
```typescript
// THROWS ERROR if 0 or >1 results (e.g., data corruption)
const { data } = await supabase
  .from('memberships')
  .select('id')
  .eq('user_id', userId)
  .single()  // ❌ Fails ungracefully
```

### Database Migrations

**Create migrations for schema changes:**

1. **Create migration file:**
   ```bash
   # Format: supabase/migrations/XXXXX_descriptive_name.sql
   # Example: 00008_add_unique_constraints.sql
   ```

2. **Include in migration:**
   - New tables/columns
   - Indexes and unique constraints
   - RLS policies
   - Comments for documentation

3. **Apply migration:**
   ```bash
   cd supabase
   supabase db push
   ```

**Race condition prevention:**
```sql
-- Use unique constraints to prevent duplicate inserts from double-clicks
CREATE UNIQUE INDEX idx_table_unique
  ON table_name(user_id, field1, field2)
  WHERE condition IS NOT NULL;
```

### Error Handling

**Database helper functions should return specific errors:**
```typescript
// ✅ Return different errors for different failure modes
async function getUserId(authId: string): Promise<{ id: string | null; error?: string }> {
  const { data, error } = await supabase.from('users').select('id').eq('auth_id', authId).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { id: null, error: 'User not found' }
    }
    console.error('Database error:', error)
    return { id: null, error: 'Database connection error' }
  }

  return { id: data.id }
}

// Usage - propagate specific errors to UI
const userResult = await getUserId(authId)
if (!userResult.id) {
  return { success: false, error: userResult.error || 'Unknown error' }
}
```

**General rules:**
- All database functions return `{ success: boolean; error?: string }`
- Check errors at every operation - don't assume success
- Display errors in UI (Alert, Dialog) - never fail silently
- Distinguish between "not found" vs "connection error" for better debugging

### Environment Variables
- Use `.env.local` (git-ignored)
- `NEXT_PUBLIC_` prefix for client-accessible vars
- Never commit credentials

### Import Conventions
- Absolute imports with `@/*` alias
- Order: React/Next → external libs → internal modules → types

## Git & Commits

### Workflow
- **Branches**: `main` (production) ← `dev` (integration) ← `feature/*`
- Branch from `dev` for new work
- PR flow: feature → dev → main

### Commit Messages
- Brief, single-line descriptions
- Use conventional commits when appropriate: `feat:`, `fix:`, `docs:`, etc.
- **NEVER include Claude as co-author or add AI-generated footers**

### Branch Naming
- `feature/descriptive-name` - new features
- `fix/bug-description` - bug fixes
- `hotfix/urgent-fix` - production hotfixes

## Code Review & Merge Workflow

### Before Merging to Main

**ALWAYS run comprehensive code review:**

1. **Invoke code-review superpower:**
   ```bash
   # Get git commit range
   git merge-base main HEAD  # Base SHA
   git rev-parse HEAD        # Head SHA
   ```

2. **Use Skill tool to launch code-reviewer:**
   - `subagent_type: superpowers:code-reviewer`
   - Fill template with: what was implemented, requirements, base/head SHAs
   - Agent will categorize issues: Critical, Important, Minor

3. **Fix issues before merging:**
   - **Critical** (MUST fix): Data loss, security, broken functionality
   - **Important** (SHOULD fix): Architecture problems, missing features, poor error handling
   - **Minor** (NICE to have): Code style, optimizations, documentation

4. **Verify fixes:**
   ```bash
   npx tsc --noEmit  # TypeScript check
   npm run lint      # Linting check
   ```

### Merging Feature Branches

**After code review approval:**

1. **Verify you're on the right branch:**
   ```bash
   git branch --show-current  # Should show your feature branch
   git status                 # Clean working tree
   ```

2. **Switch to main and merge:**
   ```bash
   git checkout main
   git pull origin main
   git merge feature-branch --no-ff -m "Merge: descriptive message"
   ```
   - Use `--no-ff` to preserve feature branch history
   - Write clear merge commit message with bullet points

3. **Push to origin:**
   ```bash
   git push origin main
   ```

4. **Clean up branches:**
   ```bash
   git branch -d feature-branch              # Delete local
   git push origin --delete feature-branch   # Delete remote
   ```

### Session Continuity

When continuing from a previous session:
- **ALWAYS verify current branch** before making edits
- Check git status to see uncommitted changes
- Review recent commits to understand context

## Testing

- **Test users:** Create via Supabase Dashboard (MCP is read-only)
  - Email: `test.user@youngmuslims.com`
  - Must set `onboarding_completed_at` to access protected routes
- **Browser testing:** Chrome DevTools MCP (primary), Playwright (backup)

## Best Practices
- **Performance**: Optimize images, minimize client JS
- **Accessibility**: Semantic HTML, ARIA labels, keyboard nav
- **Security**: Sanitize inputs, validate server-side
- **Mobile-first**: Design for mobile, enhance for desktop
