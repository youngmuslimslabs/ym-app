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

## Connecting — native psql (MCP is read-only; the direct host is IPv6-only)
`supabase db dump`/`db reset` shell out to `pg_dump` **inside Docker**; if Docker is down they fail with `Cannot connect to the Docker daemon`. The **Supabase MCP server is read-only** — great for introspection (`execute_sql` SELECTs, `list_tables`, `generate_typescript_types`) but it **cannot apply writes**: `apply_migration` errors with `Cannot apply migration in read-only mode`. So all schema/seed changes go through native `psql` (Homebrew `/opt/homebrew/bin`, v17.x), no Docker.

**Use the session pooler, NOT the direct host.** `db.<ref>.supabase.co` is **IPv6-only** (has an `AAAA` record, no `A`). On an IPv4-only network `psql` fails with `could not translate host name … nodename nor servname provided` — getaddrinfo's `AI_ADDRCONFIG` hides the `AAAA` when the machine has no IPv6 route. The **session pooler is dual-stack (has IPv4)** and is the reliable path:

```bash
export PGPASSWORD='<db password>'   # Dashboard → Settings → Database. NEVER commit.
# Port 5432 = SESSION mode (supports DDL + multi-statement transactions).
# Port 6543 = transaction mode — does NOT support session features; don't use for DDL.
# User is DOTTED: postgres.<ref>  (not bare "postgres").
PSQL=(psql -h aws-1-us-east-2.pooler.supabase.com -p 5432 -U postgres.todqvyzdvpnwuuonxwch -d postgres)
"${PSQL[@]}" -c 'select 1;'
```

- This project resolves to **us-east-2**, pooler prefix **`aws-1`** (not `aws-0`). If a pooler answers `FATAL: Tenant or user not found`, the host reached but the region/prefix is wrong — probe `aws-0`/`aws-1` × regions, or pin the region authoritatively by mapping the direct host's IPv6 against AWS's published ranges: `curl -s https://ip-ranges.amazonaws.com/ip-ranges.json` then find the `ipv6_prefix` that contains the `AAAA` address (e.g. `2600:1f16::/34` → us-east-2).
- `.env.local` holds only **API** keys (URL / anon / service_role) — the service_role key hits PostgREST, it is **not** a Postgres login and cannot dump/replay schema. The DB password is separate and not in the repo.
- CLI commands that do **not** need Docker (need `SUPABASE_ACCESS_TOKEN`): `gen types typescript --linked`, `projects list`, `migration list`. If the token isn't set, `gen types --linked` fails with empty output — fall back to the MCP `generate_typescript_types` (read-safe) and write/patch `src/types/database.types.ts` from it.
- Package manager is **bun**: type-check with `bunx tsc --noEmit`.

## Making a change
1. **Back up first** for anything destructive (same pooler host/user as `PSQL` above):
   `pg_dump -h aws-1-us-east-2.pooler.supabase.com -p 5432 -U postgres.todqvyzdvpnwuuonxwch -d postgres -n public -f backup_public.sql`
2. **Edit** `00001_initial_schema.sql` (greenfield/rebuild) — reconstruct from **live**, never hand-write, so you can't silently drop an object:
   `pg_get_functiondef`, `pg_policies`, `pg_get_constraintdef`, `pg_indexes`, `pg_publication_tables`.
   For an incremental change to an already-populated DB later, add `000NN_name.sql` instead.
3. **Apply atomically** — wrap drop + `\i 00001_initial_schema.sql` + `\i seed.sql` in ONE transaction. On any error the whole thing rolls back and nothing is lost, so this doubles as a clean-replay test:
   `"${PSQL[@]}" --single-transaction -v ON_ERROR_STOP=1 -f reset.sql`
   `--single-transaction` wraps every `-c`/`-f` in ONE transaction, so a partial/additive apply (a few `ALTER`s + `-f seed.sql -f seed_geography.sql`) is atomic too — any error rolls the whole thing back.
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
- `psql` to `db.<ref>.supabase.co` → `could not translate host name`: the direct host is IPv6-only; use the dual-stack **session pooler** (`aws-1-us-east-2.pooler.supabase.com:5432`, user `postgres.<ref>`).
- Pooler → `FATAL: Tenant or user not found`: wrong region/prefix (`aws-0` vs `aws-1`), or you used bare `postgres` instead of the dotted `postgres.<ref>`.
- MCP `apply_migration` → `read-only mode`: the MCP can't write; apply via native `psql`.
- Editing the baseline but forgetting to apply to remote AND regenerate `database.types.ts`. (When you edit the baseline in place instead of a new `000NN`, also patch `database.types.ts` to match — a hand-cast interface like `data as Subregion[]` will hide the drift from tsc.)
- Hand-writing SQL from memory → drift from live. Introspect the catalog instead.
- Verifying a destructive change without a transaction — always `--single-transaction`.
