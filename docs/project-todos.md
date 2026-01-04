# YM App - Project Todos

## Stakeholder Input (Blocking)

- [ ] Review data model with Umar Khattak
- [ ] Review data model with Nooh
- [ ] Get alumni database from Umar Khattak
- [ ] Clarify which NN database is current (Version A vs B)
- [ ] Clarify what data to collect during onboarding

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

### Auth
- [ ] Implement GSuite auth trigger (link users on first login)
- [ ] Add "Before User Created" hook (restrict to @youngmuslims.com)
- [ ] Update OAuth client IDs for production

### Security
- [ ] Add RLS policies

---

## UI

### Layout & Navigation
- [ ] App shell/layout (header, nav, content area)
- [ ] Navigation component
- [ ] Profile icon with dropdown (avatar, name, logout)
- [ ] Logout functionality

### Onboarding
- [ ] Design onboarding flow (steps, fields)
- [ ] Build onboarding pages (multi-step form)
- [ ] Handle onboarding state (redirect if incomplete)
- [ ] Save onboarding data to Supabase

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
