# YM Database Schema Design

> **Status:** READY FOR IMPLEMENTATION
> **Last Updated:** January 2026
> **Related:** [ym-hierarchy.md](./ym-hierarchy.md)

---

## Quick Reference

| Table | Purpose |
|-------|---------|
| `users` | All user data including onboarding fields |
| `regions` | Top-level geographic areas (Texas, New York, etc.) |
| `subregions` | Cities within regions (Houston, Dallas, etc.) |
| `neighbor_nets` | Local communities within subregions |
| `memberships` | Where users belong geographically |
| `role_types` | Catalog of 19 organizational roles |
| `role_assignments` | Who has what role, where, when |
| `departments` | Cabinet departments (Marketing, IT, etc.) |
| `teams` | Teams within departments |
| `user_projects` | YM project history (conventions, retreats, etc.) |

---

## Design Principles

1. **Normalized roles** — One `role_assignments` table instead of role-per-table
2. **Multi-role support** — People can hold multiple roles simultaneously
3. **Geographic + Functional separation** — "Where you belong" vs "What you do"
4. **GSuite integration** — Pre-populated users linked on first login
5. **History-ready** — `start_date`/`end_date` on assignments
6. **Strict hierarchy** — Region → Subregion → NeighborNet

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS & AUTH                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           users                                      │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ -- Identity & Auth                                                   │    │
│  │ id              UUID PRIMARY KEY                                     │    │
│  │ email           TEXT UNIQUE NOT NULL      ◄── GSuite linking key     │    │
│  │ auth_id         UUID UNIQUE → auth.users  ◄── Linked on first login  │    │
│  │ claimed_at      TIMESTAMPTZ               ◄── When first logged in   │    │
│  │                                                                       │    │
│  │ -- Basic Profile                                                      │    │
│  │ first_name      TEXT                                                 │    │
│  │ last_name       TEXT                                                 │    │
│  │ phone           TEXT                                                 │    │
│  │ avatar_url      TEXT                                                 │    │
│  │                                                                       │    │
│  │ -- Extended Profile (Onboarding Step 1)                              │    │
│  │ personal_email  TEXT                      ◄── Non-GSuite email       │    │
│  │ ethnicity       TEXT                                                 │    │
│  │ date_of_birth   DATE                                                 │    │
│  │                                                                       │    │
│  │ -- Education (Onboarding Step 5)                                     │    │
│  │ education_level TEXT                      ◄── high-school-current,   │    │
│  │                                               high-school-graduate,  │    │
│  │                                               college                │    │
│  │ education       JSONB                     ◄── [{school_name, degree, │    │
│  │                                               field, grad_year}]     │    │
│  │                                                                       │    │
│  │ -- Skills (Onboarding Step 6)                                        │    │
│  │ skills          TEXT[]                    ◄── ['leadership', ...]    │    │
│  │                                                                       │    │
│  │ -- Metadata                                                           │    │
│  │ onboarding_completed_at  TIMESTAMPTZ      ◄── NULL until complete    │    │
│  │ created_at      TIMESTAMPTZ                                          │    │
│  │ updated_at      TIMESTAMPTZ                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         GEOGRAPHIC HIERARCHY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────┐                                                 │
│  │        regions         │                                                 │
│  ├────────────────────────┤                                                 │
│  │ id          UUID PK    │                                                 │
│  │ name        TEXT       │  "Texas", "New York", "Southeast"               │
│  │ code        TEXT       │  "TX", "NY", "SE"                               │
│  │ is_active   BOOLEAN    │                                                 │
│  │ created_at  TIMESTAMPTZ│                                                 │
│  │ updated_at  TIMESTAMPTZ│                                                 │
│  └───────────┬────────────┘                                                 │
│              │ 1:N                                                          │
│              ▼                                                              │
│  ┌────────────────────────┐                                                 │
│  │       subregions       │                                                 │
│  ├────────────────────────┤                                                 │
│  │ id          UUID PK    │                                                 │
│  │ region_id   UUID FK    │ → regions                                       │
│  │ name        TEXT       │  "Houston", "Dallas", "NYC East"                │
│  │ code        TEXT       │  "HOU", "DAL", "NYC-E"                          │
│  │ is_active   BOOLEAN    │                                                 │
│  │ created_at  TIMESTAMPTZ│                                                 │
│  │ updated_at  TIMESTAMPTZ│                                                 │
│  └───────────┬────────────┘                                                 │
│              │ 1:N                                                          │
│              ▼                                                              │
│  ┌────────────────────────┐                                                 │
│  │      neighbor_nets     │                                                 │
│  ├────────────────────────┤                                                 │
│  │ id          UUID PK    │                                                 │
│  │ subregion_id UUID FK   │ → subregions                                    │
│  │ name        TEXT       │  "Katy NN", "Sugar Land NN"                     │
│  │ is_active   BOOLEAN    │                                                 │
│  │ created_at  TIMESTAMPTZ│                                                 │
│  │ updated_at  TIMESTAMPTZ│                                                 │
│  └────────────────────────┘                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            MEMBERSHIPS                                       │
│                    "Where you BELONG geographically"                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         memberships                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ id               UUID PRIMARY KEY                                    │    │
│  │ user_id          UUID FK → users                                     │    │
│  │ neighbor_net_id  UUID FK → neighbor_nets  (NULL for NS/alumni)       │    │
│  │ region_id        UUID FK → regions        (for NS members)           │    │
│  │ status           membership_status        (active/alumni/inactive)   │    │
│  │ joined_at        DATE                                                │    │
│  │ left_at          DATE                     (NULL if still active)     │    │
│  │ created_at       TIMESTAMPTZ                                         │    │
│  │ updated_at       TIMESTAMPTZ                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Usage:                                                                      │
│  - Most members: neighbor_net_id set (their NN home)                        │
│  - NS members: region_id set (regional association)                         │
│  - Alumni: status='alumni', keeps historical location                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ROLE SYSTEM                                     │
│                         "What you DO functionally"                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         role_types                                   │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ id               UUID PRIMARY KEY                                    │    │
│  │ name             TEXT UNIQUE        "National Coordinator", "NNC"    │    │
│  │ code             TEXT UNIQUE        "nc", "nnc", "src"               │    │
│  │ category         role_category      (see enums below)                │    │
│  │ scope_type       scope_type         (see enums below)                │    │
│  │ max_per_scope    INTEGER            (NULL = unlimited)               │    │
│  │ description      TEXT                                                │    │
│  │ sort_order       INTEGER NOT NULL   (hierarchy ordering for UI)      │    │
│  │ created_at       TIMESTAMPTZ                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       role_assignments                               │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ id               UUID PRIMARY KEY                                    │    │
│  │ user_id          UUID FK → users                                     │    │
│  │ role_type_id     UUID FK → role_types   (NULL if custom)             │    │
│  │ role_type_custom TEXT                   (if not in predefined list)  │    │
│  │ scope_id         UUID                   (varies by scope_type)       │    │
│  │                                                                       │    │
│  │ -- Amir/Manager                                                       │    │
│  │ amir_user_id     UUID FK → users        (if amir in system)          │    │
│  │ amir_custom_name TEXT                   (if amir not in system)      │    │
│  │                                                                       │    │
│  │ -- Date Range                                                         │    │
│  │ start_date       DATE                                                │    │
│  │ end_date         DATE                   (NULL = currently active)    │    │
│  │ is_active        BOOLEAN                                             │    │
│  │ notes            TEXT                                                │    │
│  │ created_at       TIMESTAMPTZ                                         │    │
│  │ updated_at       TIMESTAMPTZ                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  scope_id references:                                                        │
│  - national → NULL                                                          │
│  - region → regions.id                                                      │
│  - subregion → subregions.id                                                │
│  - neighbor_net → neighbor_nets.id                                          │
│  - department → departments.id                                              │
│  - team → teams.id                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          CABINET STRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐                 │
│  │      departments       │      │         teams          │                 │
│  ├────────────────────────┤      ├────────────────────────┤                 │
│  │ id          UUID PK    │      │ id          UUID PK    │                 │
│  │ name        TEXT       │      │ department_id UUID FK  │ → departments   │
│  │ code        TEXT       │      │ name        TEXT       │                 │
│  │ is_active   BOOLEAN    │      │ is_active   BOOLEAN    │                 │
│  │ created_at  TIMESTAMPTZ│      │ created_at  TIMESTAMPTZ│                 │
│  │ updated_at  TIMESTAMPTZ│      │ updated_at  TIMESTAMPTZ│                 │
│  └────────────────────────┘      └────────────────────────┘                 │
│                                                                              │
│  8 Departments: Marketing, Human Resources, Operations, Special Projects,   │
│                 Fundraising, Finance, IT, Societal Impact                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER PROJECTS                                      │
│                  "YM projects/events you've worked on"                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        user_projects                                 │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │ id               UUID PRIMARY KEY                                    │    │
│  │ user_id          UUID FK → users                                     │    │
│  │                                                                       │    │
│  │ -- Project Info                                                       │    │
│  │ project_type     TEXT                   ◄── convention, retreat, etc │    │
│  │ project_type_custom TEXT                ◄── If not in predefined     │    │
│  │ role             TEXT                   ◄── "Logistics Lead", etc    │    │
│  │ description      TEXT                   ◄── What they did            │    │
│  │                                                                       │    │
│  │ -- Amir/Manager                                                       │    │
│  │ amir_user_id     UUID FK → users        ◄── If amir in system        │    │
│  │ amir_custom_name TEXT                   ◄── If amir not in system    │    │
│  │                                                                       │    │
│  │ -- Date Range                                                         │    │
│  │ start_month      INTEGER                ◄── 1-12                      │    │
│  │ start_year       INTEGER                ◄── e.g., 2024                │    │
│  │ end_month        INTEGER                ◄── NULL if current           │    │
│  │ end_year         INTEGER                ◄── NULL if current           │    │
│  │ is_current       BOOLEAN DEFAULT false                                │    │
│  │                                                                       │    │
│  │ -- Metadata                                                           │    │
│  │ created_at       TIMESTAMPTZ                                          │    │
│  │ updated_at       TIMESTAMPTZ                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Project Types: convention, retreat, fundraiser, workshop, community-event, │
│                 training, outreach, social, service, sports                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Enums

```sql
CREATE TYPE membership_status AS ENUM ('active', 'alumni', 'inactive');

CREATE TYPE role_category AS ENUM (
  'ns',           -- National Shura (NC, NS SG, Cabinet Chair, etc.)
  'council',      -- The Council (Regional Coordinators)
  'regional',     -- Regional Shura (Cloud Rep, Special Projects)
  'subregional',  -- SR roles (SRC, SR SG)
  'neighbor_net', -- NN roles (NNC, Core Team Member)
  'cabinet',      -- Cabinet (Dept Head, Team Lead, Team Member)
  'cloud'         -- Cloud structure (Cloud Coordinator, Cloud Member)
);

CREATE TYPE scope_type AS ENUM (
  'national',     -- scope_id is NULL
  'region',       -- scope_id → regions.id
  'subregion',    -- scope_id → subregions.id
  'neighbor_net', -- scope_id → neighbor_nets.id
  'department',   -- scope_id → departments.id
  'team'          -- scope_id → teams.id
);
```

---

## Role Types (Seed Data)

| name | code | category | scope_type | max_per_scope |
|------|------|----------|------------|---------------|
| National Coordinator | nc | ns | national | 1 |
| NS Secretary General | ns_sg | ns | national | 1 |
| Cabinet Chair | cabinet_chair | ns | national | 1 |
| Council Coordinator | council_coord | ns | national | 1 |
| National Cloud Rep | nat_cloud_rep | ns | national | 1 |
| NS Member | ns_member | ns | national | NULL |
| Regional Coordinator | rc | council | region | 1 |
| Regional Cloud Rep | reg_cloud_rep | regional | region | 1 |
| Regional Special Projects | reg_special_proj | regional | region | 1 |
| Sub-Regional Coordinator | src | subregional | subregion | 1 |
| Sub-Regional Secretary General | sr_sg | subregional | subregion | 1 |
| NeighborNet Coordinator | nnc | neighbor_net | neighbor_net | 1 |
| Core Team Member | ct_member | neighbor_net | neighbor_net | NULL |
| Cloud Coordinator | cloud_coord | cloud | subregion | 1 |
| Cloud Member | cloud_member | cloud | subregion | NULL |
| Cabinet Secretary General | cabinet_sg | cabinet | national | 1 |
| Department Head | dept_head | cabinet | department | 1 |
| Cabinet Team Lead | team_lead | cabinet | team | 1 |
| Cabinet Team Member | team_member | cabinet | team | NULL |

---

## GSuite Auth Trigger

Implements **hybrid authentication**:
- Pre-populated users get linked on first login
- New @youngmuslims.com users auto-create a record
- Non-domain emails are rejected

```sql
CREATE OR REPLACE FUNCTION link_auth_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process @youngmuslims.com emails
  IF NEW.email NOT LIKE '%@youngmuslims.com' THEN
    RETURN NEW;
  END IF;

  -- Try to link to existing pre-populated user
  UPDATE public.users
  SET auth_id = NEW.id,
      claimed_at = now(),
      updated_at = now()
  WHERE email = NEW.email
    AND auth_id IS NULL;

  -- If no pre-populated user, create one
  IF NOT FOUND THEN
    INSERT INTO public.users (id, email, auth_id, claimed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), NEW.email, NEW.id, now(), now(), now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_auth_to_user();
```

**Flow:**
1. User signs in with Google (@youngmuslims.com)
2. Supabase creates `auth.users` record
3. Trigger fires → links or creates `public.users` record
4. App redirects to onboarding (if `onboarding_completed_at` is NULL) or home

---

## Onboarding → Database Mapping

| Step | Fields | Storage |
|------|--------|---------|
| 1. Personal Info | phone, personal_email, ethnicity, date_of_birth | `users` table |
| 2. Location | subregion, neighbor_net | `memberships` table |
| 3. YM Roles | role entries with amir, dates | `role_assignments` table |
| 4. YM Projects | project entries with amir, dates | `user_projects` table |
| 5. Education | education_level, degrees[] | `users.education` JSONB |
| 6. Skills | selected skills (3-5) | `users.skills` TEXT[] |

---

## Example Queries

### Get all roles for a user
```sql
SELECT rt.name AS role, rt.category,
  CASE rt.scope_type
    WHEN 'region' THEN r.name
    WHEN 'subregion' THEN sr.name
    WHEN 'neighbor_net' THEN nn.name
    WHEN 'department' THEN d.name
    WHEN 'team' THEN t.name
    ELSE 'National'
  END AS scope_name
FROM role_assignments ra
JOIN role_types rt ON rt.id = ra.role_type_id
LEFT JOIN regions r ON rt.scope_type = 'region' AND r.id = ra.scope_id
LEFT JOIN subregions sr ON rt.scope_type = 'subregion' AND sr.id = ra.scope_id
LEFT JOIN neighbor_nets nn ON rt.scope_type = 'neighbor_net' AND nn.id = ra.scope_id
LEFT JOIN departments d ON rt.scope_type = 'department' AND d.id = ra.scope_id
LEFT JOIN teams t ON rt.scope_type = 'team' AND t.id = ra.scope_id
WHERE ra.user_id = $user_id AND ra.is_active = true;
```

### Get all members who worked on conventions
```sql
SELECT u.first_name, u.last_name, up.role, up.start_year
FROM user_projects up
JOIN users u ON u.id = up.user_id
WHERE up.project_type = 'convention'
ORDER BY up.start_year DESC;
```

---

## Old Tables to Drop

```
cloud_coordinators, cloud_members, core_team_members, national_shura,
national_shura_coordinator, neighbor_nets, people, regional_coordinators,
regions, roles, sr_coordinators, subregions
```

No production data exists.

---

## Implementation Checklist

- [x] Schema design finalized
- [x] All onboarding fields mapped
- [ ] Drop old tables
- [ ] Create new tables
- [ ] Seed role_types (19 roles)
- [ ] Seed departments (8)
- [ ] Seed geographic data
- [ ] Create auth trigger
- [ ] Add RLS policies
- [ ] Generate TypeScript types

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Role storage | Normalized `role_assignments` | Avoids N tables for N roles |
| Education storage | JSONB on users | Rarely queried, self-reported |
| Projects storage | Separate `user_projects` table | Frequently queried by type |
| Skills storage | TEXT[] array | Simple, small set (3-5) |
| Authentication | GSuite + hybrid trigger | Pre-populate leadership, auto-create new users |
| Regular members | `memberships` only | No role_assignment needed |
| Alumni | `status = 'alumni'` | Historical roles kept with end_date |
