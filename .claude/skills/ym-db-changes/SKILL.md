---
name: ym-db-changes
description: Use when changing the ym-app Supabase database — editing the schema baseline, updating seed data, adding a migration, running SQL against the remote, backing up, or regenerating types. Also when `supabase db dump`/`db reset` fail with a Docker daemon error.
---

# YM Database Changes

## Overview
The shared Supabase Postgres project (ref `todqvyzdvpnwuuonxwch`, dashboard name `ym-app-dev`) holds live member data. Its name does **not** make it a disposable development database. The consolidated baseline describes a fresh rebuild; it does not authorize resetting the shared project. Use an isolated local/preview database for replay tests and follow the user's actual authorization for live changes.

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
1. Inspect the current catalog and migration ledger read-only. Use
   `pg_get_functiondef`, `pg_policies`, `pg_get_constraintdef`, `pg_indexes` and
   `pg_publication_tables` rather than assuming the baseline matches the hosted DB.
2. For an already-populated project, add an **incremental migration** with a unique
   number, checking open PRs for reserved numbers. A baseline-only edit does not
   deploy a change to existing data. Edit the baseline only for an explicitly
   requested fresh-schema rebuild; never use a reset as a routine migration.
3. Replay the chain on an isolated database and test permission/failure behavior.
   Prepare the intended delta and recovery procedure before a live apply. An
   encryption/restore workflow may be available on the current branch; check it.
4. Before an authorized live change, verify the target and take a private backup.
   Include Auth identities and migration history as well as public app data when
   the recovery plan needs them. Never commit or publicly upload a raw dump.
5. Apply the reviewed incremental file atomically with `psql -X`,
   `--single-transaction` and `-v ON_ERROR_STOP=1` (or the migration's own explicit
   transaction). Do not drop app objects or rewrite the migration ledger as part
   of ordinary application. A committed migration is not evidence it was applied.
6. Regenerate public types when the public schema/RPC interface changes, using
   a temporary output file; replace `src/types/database.types.ts` only after the
   command succeeds. Then run `bunx tsc --noEmit` and the relevant checks. Policy-
   only changes do not require a generated type change. Report local/preview/live
   verification separately. Do not wipe accounts or run Directory sync as a
   validation shortcut.

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
