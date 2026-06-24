# Database Migrations

SQL migration files for the YM app database schema.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each file in order:
   - `00001_drop_old_tables.sql`
   - `00002_create_enums.sql`
   - `00003_create_tables.sql`
   - `00004_seed_data.sql`
   - `00005_auth_trigger.sql`
   - `00006_rls_policies.sql`

### Option 2: Combined Script

Run `_run_all.sql` to execute all migrations in one go.

### Option 3: Supabase CLI

```bash
supabase db push
```

## Migration history integrity

The numbered files (`00001_*` … `00017_*`) apply in **filename order** to a fresh
database. `_run_all.sql` is the **canonical single-file bootstrap** and must stay
consistent with the numbered files.

> **Reconciled 2026-06:** `sort_order` was moved from an `ALTER TABLE ADD COLUMN`
> in `00010` into `00003`'s `CREATE TABLE`. `00004` seeds `sort_order`, so the old
> ordering failed a clean replay at `00004` ("column does not exist"). The numbered
> sequence now matches `_run_all.sql`.

Because there is a single Supabase environment, migrations are applied directly to
production via `supabase db push` — **back up first**. Verify a clean zero-error
replay on a throwaway/shadow database before relying on the numbered files for
disaster recovery (the shadow-DB step in `docs/project-todos.md`).

## Migration Files

| File | Description |
|------|-------------|
| `00001_drop_old_tables.sql` | Drops the old role-per-table schema |
| `00002_create_enums.sql` | Creates `membership_status`, `role_category`, `scope_type` |
| `00003_create_tables.sql` | Creates all tables with indexes and triggers |
| `00004_seed_data.sql` | Seeds role_types (19), departments (8), sample geography |
| `00005_auth_trigger.sql` | GSuite auth trigger for hybrid user creation |
| `00006_rls_policies.sql` | Row Level Security policies |

## After Running Migrations

1. **Configure Google OAuth** in Supabase Dashboard → Authentication → Providers
2. **Restrict to domain** by adding `@youngmuslims.com` to allowed domains
3. **Generate TypeScript types** with `supabase gen types typescript`

## Schema Overview

```
users ←──┬── memberships (geographic home)
         ├── role_assignments (functional roles)
         └── user_projects (project history)

regions ← subregions ← neighbor_nets (geographic hierarchy)

departments ← teams (cabinet structure)

role_types (reference data for 19 organizational roles)
```
