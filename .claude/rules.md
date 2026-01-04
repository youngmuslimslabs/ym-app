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

### Error Handling
- try-catch for async operations
- User-friendly error messages
- Display errors with UI components (Alert)

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

## Best Practices
- **Performance**: Optimize images, minimize client JS
- **Accessibility**: Semantic HTML, ARIA labels, keyboard nav
- **Security**: Sanitize inputs, validate server-side
- **Mobile-first**: Design for mobile, enhance for desktop
