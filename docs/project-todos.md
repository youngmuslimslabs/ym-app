# YM App - Project Todos

## Stakeholder Input (Blocking)

- [ ] Review data model with Umar Khattak
- [ ] Review data model with Nooh
- [ ] Clarify which NN database is current (Version A vs B)

---

## Database

### Schema ✅ COMPLETE
- [x] Finalize data model (answer open questions in `database-schema.md`)
- [x] Write migration SQL to drop old tables — `supabase/migrations/00001_drop_old_tables.sql`
- [x] Write migration SQL to create new tables — `supabase/migrations/00003_create_tables.sql`
- [x] Create enums — `supabase/migrations/00002_create_enums.sql`
- [x] Apply migrations to Supabase — All 10 tables live with RLS enabled

### Seed Data (Partial)
- [x] Seed `role_types` (19 roles) — `supabase/migrations/00004_seed_data.sql`
- [x] Seed `departments` (8 departments)
- [ ] Seed `teams` (per department)
- [x] Seed `regions` (sample: Texas)
- [x] Seed `subregions` (sample: Houston, Dallas)
- [x] Seed `neighbor_nets` (sample: Katy NN, Sugar Land NN, Downtown NN)
- [ ] Pre-populate `users` from NN database + alumni
- [ ] Pre-populate `role_assignments` (current leadership)
- [ ] Pre-populate `memberships`

### Static Data Prepared
- [x] US Universities list — 6,429 universities in `src/data/us-universities.json` (converted from CSV)

### Auth ✅ COMPLETE
- [x] Implement GSuite auth trigger (link users on first login) — `supabase/migrations/00005_auth_trigger.sql`
- [ ] Add "Before User Created" hook (restrict to @youngmuslims.com) — optional extra layer
- [ ] Update OAuth client IDs for production

### Security ✅ COMPLETE
- [x] Add RLS policies — `supabase/migrations/00006_rls_policies.sql`
- [x] Code review fixes — `supabase/migrations/00007_review_fixes.sql` (run this in Supabase!)

---

## UI

### Reusable Components Created
- [x] `SearchableCombobox` — Searchable dropdown with "Add new" option for custom entries
- [x] `MonthYearPicker` — Month/Year selectors for date ranges
- [x] `DateRangeInput` — Combines two MonthYearPickers with "current" checkbox
- [x] Onboarding context (`OnboardingContext`) — State management for multi-step form

### Layout & Navigation
- [x] App shell/layout (header, nav, content area) — `AppShell` component with `SidebarProvider`
- [x] Navigation component — `AppSidebar` with collapsible icon mode
- [x] Profile icon with dropdown (avatar, name, logout) — User dropdown in sidebar footer
- [x] Logout functionality — `signOut` in user dropdown

### Onboarding
- [x] Design onboarding flow (steps, fields) — 7 steps defined in `docs/plans/2026-01-03-onboarding-expansion-design.md`
- [x] Build onboarding pages (multi-step form) — Steps 1-7 implemented with validation
- [x] Form validation with blur error states (phone/email)
- [ ] Handle onboarding state (redirect if incomplete)
- [ ] Save onboarding data to Supabase

### Onboarding Data Integration ⚡ READY TO CONNECT
> **Database is live!** These can now be implemented.

- [ ] Step 2: Fetch subregions from Supabase (table: `subregions`)
- [ ] Step 2: Fetch NeighborNets from Supabase filtered by subregion (table: `neighbor_nets`)
- [ ] Step 3: Fetch Amir/Manager list from Supabase users table
- [ ] Step 4: Fetch Amir/Manager list from Supabase users table
- [ ] Step 5: Education data saves to `users.education` JSONB field
- [ ] Step 6: Skills save to `users.skills` TEXT[] field
- [ ] Step 7: Set `users.onboarding_completed_at` on completion

### Landing Page (Home)
- [x] Design landing page (what does user see after onboarding?) — Personal context card + quick actions
- [x] Build landing page — `/home` with `AppShell`, `PersonalContextCard`, `QuickActionCard`
- [ ] Show user's role(s) — currently mock data, needs DB integration

### Profile Page
- [x] Design profile page — Expandable card sections with inline editing
- [x] Build profile page — `/profile` with personal info, YM roles, projects, education, skills
- [x] Display user info from onboarding — Personal info section with inline edit
- [x] Display role assignments — YM Roles section with expandable cards
- [x] Display geographic association (NN/SR/Region) — In personal info section
- [ ] Connect to Supabase — currently using mock data

### People Page
- [x] Build people page — `/people` placeholder with "Coming soon"
- [x] Design people directory — `docs/plans/2026-01-09-people-directory-design.md`

#### Phase 1-3: Core Features ✅ COMPLETE
- [x] Browse/search all YM members — Search by name implemented
- [x] Filter by region/subregion/NN/role — Dropdown with nested submenus
- [x] Advanced filtering: project type, project role, skills, years in YM — All filter categories working
- [x] Filter pills with counts + clear actions
- [x] Switchable card/table views — ViewToggle with shadcn Tabs
- [x] Copy emails to clipboard action — CopyEmailsButton with toast

#### Phase 4: Polish (Partial)
- [x] Empty states ("No people found")
- [x] Loading skeletons — PersonCardSkeleton + PersonCardGridSkeleton
- [x] Hide filters on mobile — Search-only on mobile
- [ ] **Pagination** — See design doc Phase 4: `docs/plans/2026-01-09-people-directory-design.md#L355-L360`

#### Phase 5: Profile View
- [ ] **`/people/[id]` route** — Read-only profile view when clicking a person
- [ ] **Reuse profile components** with `isEditable={false}` prop
- [ ] **Back to directory navigation**
- See design doc Phase 5: `docs/plans/2026-01-09-people-directory-design.md#L362-L365`

#### Cleanup Before Production
- [x] Remove `/people-preview` test route
- [x] Remove middleware exception for `/people-preview`
- [ ] Connect to real Supabase data (blocked by Integration section below)

#### Future: Org Chart (Deferred)
- [ ] Org Chart — visual hierarchy explorer (separate from directory)
  - **Option A:** Simpler org chart — Geographic hierarchy only (Region → Subregion → NN)
  - **Option B:** Scoped org charts by track — "Geographic", "Cabinet", "Cloud" as separate views
  - Consider how to handle cross-cutting roles (NS members hold multiple functional roles)
  - Navigation: TBD — explore alternatives to tabs/nested sidebar

---

## Integration (When DB + UI Converge) ⚡ NEXT PRIORITY

> **Database is deployed.** Start connecting UI to Supabase.

- [ ] **Generate TypeScript types from schema** — `npx supabase gen types typescript`
- [ ] Connect onboarding form to users table
- [ ] Connect profile page to user data
- [ ] Connect people page to users + roles
- [ ] Connect landing page to role_assignments
- [ ] Test end-to-end auth flow

---

## Polish

- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Accessibility audit (keyboard navigation, screen readers)

### Progressive Web App (PWA)
- [ ] Explore iOS "Add to Home Screen" functionality for webapp
  - Research PWA requirements (manifest.json, service worker, icons)
  - Add Web App Manifest with proper iOS meta tags
  - Create app icons in required sizes (180x180 for iOS)
  - Add `apple-touch-icon` and `apple-mobile-web-app-*` meta tags
  - Test standalone mode behavior on iOS Safari
  - Consider splash screen configuration

---

## Product Analytics

- [ ] Integrate PostHog for event tracking and user analytics

---

## Testing

### Foundation
- [x] Set up Vitest testing framework
- [x] Add test scripts to package.json (`bun test`, `bun run test:watch`)
- [x] Create CI/CD workflow with test step (`.github/workflows/ci.yml`)
- [x] Example unit test for `cn()` utility
- [x] Migrate from npm to Bun package manager

### Unit Tests (Next)
- [ ] Unit tests for validation functions (phone, email)

### Component Tests (Later)
- [ ] Component tests for onboarding steps

### E2E Tests (Eventually)
- [ ] E2E tests for onboarding flow
- [ ] E2E tests for auth flow

---

## Technical Debt / Cleanup

- [ ] Fix production build error (`/_error` module not found)
- [ ] Update baseline-browser-mapping package (dev warning)
- [ ] Consider extracting common onboarding step layout to shared component
- [ ] Add loading skeletons for Supabase data fetching

---

## Onboarding UX Enhancement

> **How to implement:** Use the `frontend-design` skill when ready to build these.
> Run: `use the frontend design skill to implement the onboarding motion/transitions`
> The skill will guide you through creating distinctive, production-grade UI with motion.

### Priority 1: Page Transitions (Foundation)
- [ ] Install framer-motion: `bun add framer-motion`
- [ ] Create `OnboardingTransition` wrapper component
- [ ] Wrap each step's content with animated enter/exit
- [ ] Direction-aware: forward slides left, back slides right
- [ ] Smooth fade + translate (opacity 0→1, x: ±20px → 0)

### Priority 2: Step 7 Celebration (Memorable Ending)
- [ ] Install confetti library: `bun add canvas-confetti`
- [ ] Animated SVG checkmark that draws itself on mount
- [ ] Confetti burst triggered on page load
- [ ] Personalized message using user's name from context
- [ ] Staggered text reveal for heading and subtext

### Priority 3: Step Indicator (Visual Progress)
- [ ] Replace thin `<Progress>` bar with segmented step indicator
- [ ] Show step numbers (1-7) connected by lines
- [ ] Completed steps show checkmarks
- [ ] Current step highlighted with animation
- [ ] Optional: show step labels on hover/focus

### Priority 4: Step 1 Welcome (First Impression)
- [ ] Staggered reveal: heading → subtext → form fields (with delays)
- [ ] Subtle background gradient or decorative element
- [ ] Consider warm color accent for welcoming feel

### Priority 5: Micro-interactions (Polish)
- [ ] Step 6 skill badges: bouncy scale animation on selection
- [ ] Steps 3-5: new cards animate in when added (slide + fade)
- [ ] Button hover states: subtle lift/shadow effect
- [ ] Input focus: glowing border animation

---

## Component Improvements

### SearchableCombobox UX
- [ ] Always show "Add new option" at bottom of dropdown list (not just when typing)
  - **Current behavior:** "Add new" only appears when user types something not in the list
  - **Problem:** Users may not know they can add custom entries
  - **Idea:** Show a persistent "Add custom..." option at the bottom, perhaps styled differently (muted, with + icon)
  - **Open question:** How does this interact with the search/filter? Always visible, or only when list is short?
- [ ] Consider placeholder text hint: "Select or type to add your own"

---

### Design Notes
- **Current issue:** Every step looks identical (monotonous layout)
- **Color:** Currently pure grayscale—consider adding one accent color
- **Typography:** Using default font-sans—consider a display font for headings
