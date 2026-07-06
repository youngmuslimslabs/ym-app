---
name: ym-db-changes
description: Use when changing the ym-app Supabase database — editing the schema baseline, updating seed data, adding a migration, running SQL against the remote, backing up, or regenerating types. Also when `supabase db dump`/`db reset` fail with a Docker daemon error.
---

# YM Database Changes

## Overview
One Supabase Postgres project (ref `todqvyzdvpnwuuonxwch`, dashboard name `ym-app-dev`). The schema is **one consolidated baseline**; reference data is **one seed**. It is pre-prod and throwaway — the remote gets wiped and users re-sync from Google Workspace before real users onboard.

## Layout
- `supabase/migrations/00001_initial_schema.sql` — the entire schema (enums, tables, indexes, functions, triggers, RLS, realtime). The old `00001`–`00019` chain was squashed here 2026-07-06.
- `supabase/seed.sql` — canonical seed, **`role_types` only** (geography + cabinet structure are owner-provided later; users come from the Google sync). Wired via `config.toml [db.seed]`.
- `supabase/seed/*.sql` — dev/test fixtures (mock users, smoke tests). Run by hand; **not** canonical.

## Connecting — native psql, not the CLI, when Docker is down
`supabase db dump` and `db reset` shell out to `pg_dump` **inside Docker**. If Docker isn't running they fail with `Cannot connect to the Docker daemon`. Native `psql`/`pg_dump` (Homebrew `/opt/homebrew/bin`, v17.x) talk to the remote directly with no Docker:

```bash
export PGPASSWORD='<db password>'                 # Dashboard → Settings → Database. NEVER commit.
HOST=db.todqvyzdvpnwuuonxwch.supabase.co
psql -h "$HOST" -U postgres -d postgres -c 'select 1;'
```

- `.env.local` holds only **API** keys (URL / anon / service_role) — the service_role key hits PostgREST, it is **not** a Postgres login and cannot dump/replay schema. The DB password is separate and not in the repo.
- CLI commands that do **not** need Docker (need `SUPABASE_ACCESS_TOKEN`): `gen types typescript --linked`, `projects list`, `migration list`.
- Package manager is **bun**: type-check with `bunx tsc --noEmit`.

## Making a change
1. **Back up first** for anything destructive:
   `pg_dump -h "$HOST" -U postgres -d postgres -n public -f backup_public.sql`
2. **Edit** `00001_initial_schema.sql` (greenfield/rebuild) — reconstruct from **live**, never hand-write, so you can't silently drop an object:
   `pg_get_functiondef`, `pg_policies`, `pg_get_constraintdef`, `pg_indexes`, `pg_publication_tables`.
   For an incremental change to an already-populated DB later, add `000NN_name.sql` instead.
3. **Apply atomically** — wrap drop + `\i 00001_initial_schema.sql` + `\i seed.sql` in ONE transaction. On any error the whole thing rolls back and nothing is lost, so this doubles as a clean-replay test:
   `psql -h "$HOST" -U postgres -d postgres --single-transaction -v ON_ERROR_STOP=1 -f reset.sql`
   Drop app objects but **keep the `public` schema** so Supabase grants + default privileges survive (new tables stay reachable by anon/authenticated).
4. **Fix the migration ledger** after a manual rebuild:
   `delete from supabase_migrations.schema_migrations; insert into supabase_migrations.schema_migrations(version,name) values ('00001','initial_schema');`
5. **Regenerate types + verify**:
   `npx supabase gen types typescript --linked --schema public > src/types/database.types.ts && bunx tsc --noEmit`
6. **After a wipe, re-run the Google Workspace sync** — users repopulate from there, not the seed.

## Rules of thumb
- Keep unique constraints that guard onboarding double-submit (`idx_*_unique`, one-active-membership). CLAUDE.md: "use unique constraints to prevent race conditions."
- Leadership/rosters are `role_assignments` (scope_type + scope_id), never scalar columns.
- **Never commit a DB password or PAT.** If one is exposed, rotate it: Dashboard → Database (reset password) and Account → Access Tokens (revoke).

## Common mistakes
- `supabase db dump/reset` → Docker error: switch to native `psql`/`pg_dump`.
- Editing the baseline but forgetting to apply to remote AND regenerate `database.types.ts`.
- Hand-writing SQL from memory → drift from live. Introspect the catalog instead.
- Verifying a destructive change without a transaction — always `--single-transaction`.
