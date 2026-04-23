# YM App - Project Todos

> **`[LAUNCH]` prefix** marks items required before going live to real users. Grep `[LAUNCH]` to see the full launch-blocking punch list.

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
> ⚠️ **Note:** Current seed data is placeholder/sample data. Real production data (regions, subregions, NNs, users) needs to be obtained from Umar/Nooh.

- [x] Seed `role_types` (19 roles) — `supabase/migrations/00004_seed_data.sql`
- [x] Seed `departments` (8 departments)
- [ ] [LAUNCH] Seed `teams` (per department)
- [x] Seed `regions` (sample: Texas) — ⚠️ placeholder
- [x] Seed `subregions` (sample: Houston, Dallas) — ⚠️ placeholder
- [x] Seed `neighbor_nets` (sample: Katy NN, Sugar Land NN, Downtown NN) — ⚠️ placeholder
- [ ] [LAUNCH] Pre-populate `users` from NN database + alumni
- [ ] [LAUNCH] Pre-populate `role_assignments` (current leadership)
- [ ] [LAUNCH] Pre-populate `memberships`
- [ ] [LAUNCH] Replace placeholder seeds (`regions`, `subregions`, `neighbor_nets`) with real data from NN database

### Static Data Prepared
- [x] US Universities list — 6,429 universities in `src/data/us-universities.json` (converted from CSV)

### Auth ✅ COMPLETE
- [x] Implement GSuite auth trigger (link users on first login) — `supabase/migrations/00005_auth_trigger.sql`
- [x] Multi-layer domain validation (Google OAuth hint, client-side, middleware) — sufficient for internal app
- [ ] [LAUNCH] Update OAuth client IDs for production

### Security ✅ COMPLETE
- [x] Add RLS policies — `supabase/migrations/00006_rls_policies.sql`
- [x] Code review fixes — `supabase/migrations/00007_review_fixes.sql` (run this in Supabase!)
- [ ] [LAUNCH] **Manual review of RLS policies** — verify policies work as expected with real usage patterns

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

### Onboarding ✅ COMPLETE
- [x] Design onboarding flow (steps, fields) — 7 steps defined in `docs/plans/2026-01-03-onboarding-expansion-design.md`
- [x] Build onboarding pages (multi-step form) — Steps 1-7 implemented with validation
- [x] Form validation with blur error states (phone/email)
- [x] Handle onboarding state (redirect if incomplete)
- [x] Save onboarding data to Supabase

### Onboarding Data Integration ✅ COMPLETE
- [x] Step 2: Fetch subregions from Supabase (table: `subregions`)
- [x] Step 2: Fetch NeighborNets from Supabase filtered by subregion (table: `neighbor_nets`)
- [x] Step 3: Fetch Amir/Manager list from Supabase users table
- [x] Step 4: Fetch Amir/Manager list from Supabase users table
- [x] Step 5: Education data saves to `users.education` JSONB field
- [x] Step 6: Skills save to `users.skills` TEXT[] field
- [x] Step 7: Set `users.onboarding_completed_at` on completion

### Landing Page (Home) ✅ COMPLETE
- [x] Design landing page (what does user see after onboarding?) — Personal context card + quick actions
- [x] Build landing page — `/home` with `AppShell`, `PersonalContextCard`, `QuickActionCard`
- [x] Show user's role(s) — connected to Supabase

### Profile Page ✅ COMPLETE
- [x] Design profile page — Expandable card sections with inline editing
- [x] Build profile page — `/profile` with personal info, YM roles, projects, education, skills
- [x] Display user info from onboarding — Personal info section with inline edit
- [x] Display role assignments — YM Roles section with expandable cards
- [x] Display geographic association (NN/SR/Region) — In personal info section
- [x] Connect to Supabase

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

#### Phase 4: Polish ✅ COMPLETE
- [x] Empty states ("No people found")
- [x] Loading skeletons — PersonCardSkeleton + PersonCardGridSkeleton
- [x] Hide filters on mobile — Search-only on mobile
- [x] **Pagination** — Load More button for card view (20 items at a time)

#### Phase 5: Profile View ✅ COMPLETE
- [x] **`/people/[id]` route** — Read-only profile view when clicking a person
- [x] **Reuse profile components** with `isEditable={false}` prop — Uses `ProfileModeProvider`
- [x] **Back to directory navigation** — Back button with smart URL preservation
- See design doc Phase 5: `docs/plans/2026-01-09-people-directory-design.md#L362-L365`

#### Cleanup Before Production ✅ COMPLETE
- [x] Remove `/people-preview` test route
- [x] Remove middleware exception for `/people-preview`
- [x] Connect to real Supabase data

#### Future: Org Chart (Deferred)
- [ ] Org Chart — visual hierarchy explorer (separate from directory)
  - **Option A:** Simpler org chart — Geographic hierarchy only (Region → Subregion → NN)
  - **Option B:** Scoped org charts by track — "Geographic", "Cabinet", "Cloud" as separate views
  - Consider how to handle cross-cutting roles (NS members hold multiple functional roles)
  - Navigation: TBD — explore alternatives to tabs/nested sidebar

---

## Integration (When DB + UI Converge) ✅ COMPLETE

- [x] Connect onboarding form to users table
- [x] Connect profile page to user data
- [x] **Generate TypeScript types from schema** — `bun run db:types`
- [x] Connect people page to users + roles
- [x] Connect landing page to role_assignments
- [ ] [LAUNCH] Test end-to-end auth flow

---

## Polish

- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Accessibility audit (keyboard navigation, screen readers)

### Progressive Web App (PWA) ✅ COMPLETE
- [x] Explore iOS "Add to Home Screen" functionality for webapp
  - [x] Research PWA requirements (manifest.json, service worker, icons)
  - [x] Add Web App Manifest with proper iOS meta tags — `public/manifest.json`
  - [x] Create app icons in required sizes (180x180 for iOS) — `apple-touch-icon.png`, `icon-192x192.png`, `icon-512x512.png`
  - [x] Add `apple-touch-icon` and `apple-mobile-web-app-*` meta tags — via Next.js metadata in `layout.tsx`
  - [ ] Test standalone mode behavior on iOS Safari
  - [ ] Consider splash screen configuration
  - [x] **Creative iOS Safari install banner** — `IOSInstallPrompt` component shows on iOS Safari only
    - ⚠️ **TODO: Revisit** — Add animations, better timing, analytics, A/B testing (see component TODOs)

---

## Product Analytics

- [ ] [LAUNCH] Integrate PostHog for event tracking and user analytics

---

## Environments & Deployment

> Currently only one Supabase environment exists — production changes have no safety net. These items establish dev/prod separation, an automated deployment pipeline, and backup/restore.

### Environments
- [ ] [LAUNCH] Stand up a separate **dev** Supabase project (distinct from prod)
  - Separate project ref, URL, and anon/service keys
  - Mirror schema via `supabase db push` from `supabase/migrations/`
  - Seed with placeholder/sample data (prod gets real data only)
- [ ] [LAUNCH] Split env vars per environment (`.env.development`, `.env.production`) and wire into Netlify contexts (Deploy Previews + Branch Deploys → dev, Production → prod)
- [ ] [LAUNCH] Document environment switching + onboarding for new contributors in `README.md`
- [ ] Decide whether a **staging** env is needed in addition to dev/prod (defer unless prod bugs leak through)

### CI/CD Pipeline
- [ ] [LAUNCH] Define branch strategy: `feature/*` → `dev` → `main` (prod)
  - `feature/*` PRs auto-deploy Netlify preview pointed at **dev** Supabase
  - Merges to `dev` auto-deploy the dev Netlify site
  - Merges to `main` auto-deploy prod after CI passes
- [ ] [LAUNCH] Branch protection on `main` and `dev`: require passing CI + 1 review, no direct pushes
- [ ] [LAUNCH] Migration promotion flow: apply to dev first, verify, then apply to prod (no direct-to-prod migrations)
- [ ] [LAUNCH] Rollback plan documented (Netlify rollback + migration down-scripts or point-in-time restore)

### Database Backups
- [ ] [LAUNCH] Confirm Supabase automated daily backups are enabled on prod (check plan — Pro tier required for PITR)
- [ ] [LAUNCH] Set up scheduled logical backups (`pg_dump` via GitHub Actions cron → secure storage like S3/R2) as a provider-independent fallback
- [ ] [LAUNCH] Document + **test** the restore procedure on the dev environment (an untested backup is not a backup)
- [ ] [LAUNCH] Retention policy: daily for 7 days, weekly for 4 weeks, monthly for 12 months (adjust per storage cost)
- [ ] Consider alerting if a scheduled backup fails (cron job health check)

---

## Testing

### Foundation
- [x] Set up Vitest testing framework
- [x] Add test scripts to package.json (`bun test`, `bun run test:watch`)
- [x] Create CI/CD workflow with test step (`.github/workflows/ci.yml`)
- [x] Example unit test for `cn()` utility
- [x] Migrate from npm to Bun package manager

### Unit Tests ✅ COMPLETE
- [x] Unit tests for validation functions (phone, email) — `src/lib/validation.test.ts` (23 test cases)
- [x] Extract duplicated validation functions to shared module — `src/lib/validation.ts`

### Component Tests (Later)
- [ ] [LAUNCH] Component tests for onboarding steps

### E2E Tests (Foundation Ready)
- [x] Set up Playwright E2E framework — `playwright.config.ts`, `e2e/` directory
- [x] Add test:e2e scripts to package.json
- [x] Create example smoke tests — `e2e/example.spec.ts`
- [ ] [LAUNCH] E2E tests for onboarding flow
- [ ] [LAUNCH] E2E tests for auth flow

---

## CI/CD Enhancements

- [ ] [LAUNCH] Add test coverage threshold (fail CI if coverage drops below 80%)
- [ ] [LAUNCH] Add bundle size check (warn if build output grows significantly)
- [ ] [LAUNCH] Add E2E tests with Playwright to CI
- [ ] [LAUNCH] Add accessibility checks (axe-core) to CI
- [ ] [LAUNCH] Add security scanning (dependency audit) to CI

---

## Technical Debt / Cleanup

- [x] Fix production build error — switched to local fonts (Geist) to avoid network dependencies at build time
- [x] Update baseline-browser-mapping package — updated via `bun update`
- [x] Extract common onboarding step layout to shared component — `OnboardingLayout`, `OnboardingContent`, `OnboardingLoadingState`, `OnboardingErrorState` in `src/app/onboarding/components/`
- [x] Add loading skeletons for Supabase data fetching — Added `loading.tsx` files for `/home`, `/people`, `/people/[id]`, `/profile` pages with appropriate skeletons

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

## Exploratory / Spikes (Research & Ideation)

> **Note:** These are exploratory tasks ("spikes") to investigate feasibility and brainstorm ideas. No immediate implementation required.

### Career & Networking Features
- [ ] **Spike: Employment data integration**
  - Explore LinkedIn scraping or other methods to get info on where GSuite users work
  - Use case: Enable YM members to give each other referrals at their companies
  - Consider: LinkedIn API limitations, privacy concerns, alternative data sources (manual input, company email domains)
  - Research: Legal/ethical considerations for scraping, GDPR/privacy compliance

### Community Engagement Features
- [ ] **Spike: Collective social media feed**
  - Explore creating a unified Instagram feed from all NeighborNets
  - Use case: Showcase community activity, events, and culture in one place
  - Consider: Instagram API restrictions, hashtag aggregation, embedding options
  - Research: Authentication requirements, rate limits, content moderation needs

### User Engagement Strategy
- [ ] **Spike: User engagement & retention**
  - Brainstorm ways to get users to actively engage with the app beyond admin tasks
  - Current state: App is primarily for administrators (onboarding, directory, profiles)
  - Ideas to explore:
    - Social features: commenting, reactions, posts/updates
    - Gamification: achievements, leaderboards, participation streaks
    - Community features: event RSVPs, resource sharing, Q&A forums
    - Personal value: prayer times, Islamic resources, local masjid info
    - Notifications: announcements, reminders, milestone celebrations
  - Research: What keeps users coming back? Study successful community platforms

---

### Design Notes
- **Current issue:** Every step looks identical (monotonous layout)
- **Color:** Currently pure grayscale—consider adding one accent color
- **Typography:** Using default font-sans—consider a display font for headings
