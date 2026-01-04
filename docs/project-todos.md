# YM App - Project Todos

## Stakeholder Input (Blocking)

- [ ] Review data model with Umar Khattak
- [ ] Review data model with Nooh
- [ ] Get alumni database from Umar Khattak
- [ ] Clarify which NN database is current (Version A vs B)

---

## Database

### Schema
- [ ] Finalize data model (answer open questions in `database-schema.md`)
- [ ] Write migration SQL to drop old tables
- [ ] Write migration SQL to create new tables
- [ ] Apply migrations to Supabase

### Seed Data
- [ ] Seed `role_types` (20 roles defined)
- [ ] Seed `departments` (8 departments)
- [ ] Seed `teams` (per department)
- [ ] Seed `regions`
- [ ] Seed `subregions`
- [ ] Seed `neighbor_nets`
- [ ] Pre-populate `users` from NN database + alumni
- [ ] Pre-populate `role_assignments` (current leadership)
- [ ] Pre-populate `memberships`

### Static Data Prepared
- [x] US Universities list — 6,429 universities in `src/data/us-universities.json` (converted from CSV)

### Auth
- [ ] Implement GSuite auth trigger (link users on first login)
- [ ] Add "Before User Created" hook (restrict to @youngmuslims.com)
- [ ] Update OAuth client IDs for production

### Security
- [ ] Add RLS policies

---

## UI

### Reusable Components Created
- [x] `SearchableCombobox` — Searchable dropdown with "Add new" option for custom entries
- [x] `MonthYearPicker` — Month/Year selectors for date ranges
- [x] `DateRangeInput` — Combines two MonthYearPickers with "current" checkbox
- [x] Onboarding context (`OnboardingContext`) — State management for multi-step form

### Layout & Navigation
- [ ] App shell/layout (header, nav, content area)
- [ ] Navigation component
- [ ] Profile icon with dropdown (avatar, name, logout)
- [ ] Logout functionality

### Onboarding
- [x] Design onboarding flow (steps, fields) — 7 steps defined in `docs/plans/2026-01-03-onboarding-expansion-design.md`
- [x] Build onboarding pages (multi-step form) — Steps 1-7 implemented with validation
- [x] Form validation with blur error states (phone/email)
- [ ] Handle onboarding state (redirect if incomplete)
- [ ] Save onboarding data to Supabase

### Onboarding Data Integration (currently using placeholders)
- [ ] Step 2: Fetch subregions from Supabase (currently hardcoded)
- [ ] Step 2: Fetch NeighborNets from Supabase filtered by subregion
- [ ] Step 3: Fetch Amir/Manager list from Supabase users table
- [ ] Step 4: Fetch Amir/Manager list from Supabase users table
- [ ] Step 6: Define skills list (currently hardcoded placeholder)

### Landing Page
- [ ] Design landing page (what does user see after onboarding?)
- [ ] Build landing page
- [ ] Show user's role(s)

### Profile Page
- [ ] Design profile page
- [ ] Build profile page
- [ ] Display user info from onboarding
- [ ] Display role assignments
- [ ] Display geographic association (NN/SR/Region)

### People Page
- [ ] Design people directory
- [ ] Build people page
- [ ] Browse/search all YM members
- [ ] Filter by region/subregion/NN/role

---

## Integration (When DB + UI Converge)

- [ ] Connect onboarding form to users table
- [ ] Connect profile page to user data
- [ ] Connect people page to users + roles
- [ ] Connect landing page to role_assignments
- [ ] Generate TypeScript types from schema
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

- [ ] Unit tests for validation functions (phone, email)
- [ ] Component tests for onboarding steps
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
- [ ] Install framer-motion: `npm install framer-motion`
- [ ] Create `OnboardingTransition` wrapper component
- [ ] Wrap each step's content with animated enter/exit
- [ ] Direction-aware: forward slides left, back slides right
- [ ] Smooth fade + translate (opacity 0→1, x: ±20px → 0)

### Priority 2: Step 7 Celebration (Memorable Ending)
- [ ] Install confetti library: `npm install canvas-confetti`
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

