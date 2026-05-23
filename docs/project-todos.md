# YM App - Project Todos

> **`[LAUNCH]` prefix** marks items required before going live to real users. Grep `[LAUNCH]` to see the full launch-blocking punch list.

## Stakeholder Input (Blocking)

- [ ] Review data model with Umar Khattak
- [ ] Review data model with Nooh
- [ ] Clarify which NN database is current (Version A vs B)

---

## Database

### Seed Data (Partial)
> ⚠️ **Note:** Current seed data is placeholder/sample data. Real production data (regions, subregions, NNs, users) needs to be obtained from Umar/Nooh.

- [ ] [LAUNCH] Seed `teams` (per department)
- [x] Seed `regions` (sample: Texas) — ⚠️ placeholder
- [x] Seed `subregions` (sample: Houston, Dallas) — ⚠️ placeholder
- [x] Seed `neighbor_nets` (sample: Katy NN, Sugar Land NN, Downtown NN) — ⚠️ placeholder
- [ ] [LAUNCH] Pre-populate `users` from NN database + alumni
- [ ] [LAUNCH] Pre-populate `role_assignments` (current leadership)
- [ ] [LAUNCH] Pre-populate `memberships`
- [ ] [LAUNCH] Replace placeholder seeds (`regions`, `subregions`, `neighbor_nets`) with real data from NN database

### Auth
- [ ] [LAUNCH] Update OAuth client IDs for production

### Security
- [ ] [LAUNCH] **Manual review of RLS policies** — verify policies work as expected with real usage patterns

---

## UI

### People Page

#### Future: Org Chart (Deferred)
- [ ] Org Chart — visual hierarchy explorer (separate from directory)
  - **Option A:** Simpler org chart — Geographic hierarchy only (Region → Subregion → NN)
  - **Option B:** Scoped org charts by track — "Geographic", "Cabinet", "Cloud" as separate views
  - Consider how to handle cross-cutting roles (NS members hold multiple functional roles)
  - Navigation: TBD — explore alternatives to tabs/nested sidebar

---

## Integration

- [ ] [LAUNCH] Test end-to-end auth flow

---

## Polish

- [ ] Finalize loading state and error state patterns
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile responsiveness
- [ ] Accessibility audit (keyboard navigation, screen readers)

### Progressive Web App (PWA)
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

### Component Tests
- [ ] [LAUNCH] Component tests for onboarding steps 2–5, 7

### E2E Tests
- [ ] [LAUNCH] Authenticated onboarding flow (requires test Supabase project + test user) — skipped block in `e2e/onboarding.spec.ts`
- [ ] [LAUNCH] Authenticated auth flow (signed-in redirect rules, domain validation) — skipped block in `e2e/auth.spec.ts`

---

## CI/CD Enhancements

- [ ] [LAUNCH] Raise coverage thresholds to 80% — currently ~5%; depends on broader component test coverage. Track ratchet in commits to `vitest.config.mts`.
- [ ] [LAUNCH] Add bundle size check (warn if build output grows significantly)

---

## Technical Debt / Cleanup

- [ ] **Fix local jsdom CJS load error** — `bunx vitest run` crashes locally with `TypeError: LRUCache is not a constructor` at `node_modules/jsdom/lib/jsdom/living/css/helpers/css-values.js:42`. Transitive-dep mismatch between jsdom and `lru-cache`. CI is unaffected (clean install). Workaround: pure-logic tests declare `// @vitest-environment node` to skip jsdom, but this masks the bug for component tests. Fix via `package.json` `overrides`/`resolutions` pinning a compatible `lru-cache`, or wait for jsdom to release a fixed version.

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

---

## Admin Schedule Rebuild — Code Review Findings (2026-05-22)

> Findings from a code review of `feature/admin-rebuild` before merge. Grouped by severity. Each item: short description, then file:line.

### Silent data loss (fix before merge)

- [ ] **Tab switch destroys unsaved form edits.** User edits a session, clicks Info/Attendees/Feedback — `<TabsContent>` unmounts `ScheduleEditor` entirely, FormMode's cleanup fires `onDirtyChange(false)`, no prompt. (`src/app/(app)/admin/conferences/[conferenceId]/ConferenceEditor.tsx:191`)
- [ ] **FormMode Cancel button bypasses the dirty guard.** The most common discard path calls `onModeChange` directly with no confirmation, defeating the entire dirty-tracking system. (`SessionPanel.tsx:542`)
- [ ] **`shallowEqualForm` doesn't trim, but submit does** → after saving e.g. `'  Title  '` the server returns `'Title'`, `initialForm` updates, `form` still has the padded original, isDirty stays true forever. Every later row click pops a spurious discard dialog. (`SessionPanel.tsx:348`)
- [ ] **`attemptNav` silently overwrites a queued `pendingNav`.** Two row clicks before dismissing the discard dialog → first nav intent dropped, no UI hint. (`ScheduleEditor.tsx:64`)

### Visible regressions

- [ ] **Header "Add session" button no-ops on Info / Attendees / Feedback tabs.** Radix unmounts inactive TabsContent so `scheduleRef.current` is null; the optional chain swallows the click. Either auto-switch to Schedule first, or hide the button. (`ConferenceEditor.tsx:133`)
- [ ] **Hardcoded `grid grid-cols-2` with no responsive layout.** Replaces the old mobile Sheet + desktop Dialog combo with a desktop-only two-column layout. CLAUDE.md mandates 375/393/430px testing. (`ScheduleEditor.tsx:193`)
- [ ] **Focus regression on every mode transition except create-mode title.** Old Dialog provided auto-focus; the inline panel only focuses on create. view→edit, edit→view via Cancel, delete→view via Cancel all drop focus to `<body>`. (`SessionPanel.tsx:401`)

### Correctness bugs (rare windows, real impact)

- [ ] **`composeTzIso` DST spring-forward off-by-one writes the wrong UTC instant to the DB.** Documented as a "KNOWN LIMITATION" in the source; `SessionPanel.handleSubmit` calls it directly. Window: 02:00–07:00 wall clock on the second Sunday of March, US tz only. Fix sketch lives in `datetime.ts:16-18`; a pinned `it.skip` is waiting in `datetime.test.ts`. (`src/app/(app)/admin/conferences/lib/datetime.ts:19`)
- [ ] **`roomConflict` ISO format mismatch creates false-positive overlap warnings.** DB timestamps come back as `+00:00`, freshly composed values are `.000Z`; char 19 ('+' vs '.') makes back-to-back sessions falsely flag as overlapping. Use numeric instant compare (`Date.parse`) or normalize both sides to `.000Z`. (`SessionPanel.tsx:473`)
- [ ] **`pendingSavedId` effect can clobber user's deliberate navigation between save and refresh.** Same effect also pops the saved row into view after a Cancel-post-save. Track whether the user has navigated away (or made a fresh selection) since the save fired, and clear `pendingSavedId` in that case. (`ScheduleEditor.tsx:79`)
- [ ] **Dirty stays true after a successful save until the refresh arrives** → spurious discard dialog if the user clicks another row in the ~200-500ms window. Clear the dirty flag inside `handleSubmit` on success, or have the parent reset it when `pendingSavedId` is set. (`SessionPanel.tsx:411`)
- [ ] **`loadRoster` drops users who have a check-in but no signup.** ViewMode Stat panel shows "Checked in: 1" while the roster tab shows 0 attendees — admin can't see who actually checked in. Union signups+check-ins as the keyset. (`loadRoster.ts:49`)
- [ ] **DeleteMode async promise not cancelled on unmount** — Cancel mid-delete still fires `onAfterDelete` against the (now-stale) parent, yanking the user off whatever page they navigated to. Add a `useRef` cancellation guard. (`SessionPanel.tsx:821`)

### Smaller / latent

- [ ] **`dateOk` silently disables Save with no field-level error** when an edited session's date is outside the (shortened) conference range. Surface the error on the Day Select. (`SessionPanel.tsx:445`)
- [ ] **`endTime > startTime` string compare disallows midnight-crossing sessions** and the error message "End must be after start" is misleading. Either support overnight sessions or fix the error copy. (`SessionPanel.tsx:448`)
- [ ] **`pendingSavedId` has no timeout fallback** (already TODO'd at `ScheduleEditor.tsx:73`). If the saved row never reappears (RLS scope change, refresh failure), the panel sits in form mode forever.
- [ ] **`onDirtyChange` dual-effect pattern is fragile** — depends on parent's `useCallback([],)` identity; a future refactor that drops the memoization would silently break the discard guard. Consider computing dirty in the parent or wrapping cleanup so it only fires on true unmount. (`SessionPanel.tsx:411,416`)
- [ ] **`loadRoster` `.order('created_at', ascending: true)` is dead code** — the final local sort overrides it. Remove the dead clause to avoid misleading future readers. (`loadRoster.ts:22`)
- [ ] **`SessionPanel.test.tsx` 'roster filter tabs' test doesn't await the loadRoster promise** — asserts against the loading-frame snapshot. A regression that hides tabs behind loading state would still pass. (`SessionPanel.test.tsx:49`)
