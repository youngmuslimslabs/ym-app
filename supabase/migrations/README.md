# Database Migrations

## Layout

- **`00001_initial_schema.sql`** — the entire database structure (enums, tables,
  indexes, functions, triggers, RLS, realtime) in one consolidated baseline.
- **`../seed.sql`** — canonical reference data (`role_types` only). Wired into
  `config.toml` `[db.seed]`, so it loads automatically after migrations on reset.
- **`../seed/*.sql`** — dev/test fixtures (mock users, conference smoke test,
  feedback eyeball), run **by hand**, never part of an automated reset.

## History

Squashed **2026-07-06** from the previous `00001`–`00019` chain. That chain had
accreted fix-on-fix migrations and a `_run_all.sql` bootstrap that had silently
drifted (missing the entire conferences feature, `sync_logs`, and the `system`
role category). The baseline was **reconstructed from the live schema via catalog
introspection** (exact function bodies, policies, constraints, indexes), then two
sets of changes were folded in:

1. **Cabinet naming** — `departments`→`cabinet_departments`, `teams`→`cabinet_teams`,
   `scope_type` `department`/`team` → `cabinet_department`/`cabinet_team`, and the
   role "Department Head" → "Cabinet Department Head".
2. **Additive** — `conferences` scope (`scope_level` + `region_id` + `subregion_id`
   + `point_of_contact_user_id` + hierarchy CHECK); `memberships.subregion_id` with
   the location CHECK relaxed to "at most one"; `is_expansion` on the three geography
   tables.

## Rebuilding

The remote pre-prod DB was **rebuilt from this baseline on 2026-07-06** — its
migration ledger now holds only `00001`. Data was all seed/fake and was wiped;
real users re-sync from Google Workspace. It will be wiped + rebuilt once more
before real users onboard.

To rebuild from scratch locally (requires Docker):

```bash
supabase db reset   # applies 00001_initial_schema.sql, then ../seed.sql
```

Without Docker, the remote can be rebuilt directly (what was done on 2026-07-06):
`pg_dump` a backup, then `psql --single-transaction` a drop-public-objects +
`\i 00001_initial_schema.sql` + `\i ../seed.sql` script (atomic — rolls back on
any error), then reset `supabase_migrations.schema_migrations` to a single row.

> ✅ **Replay-verified 2026-07-06.** Applied atomically to the linked remote
> (Postgres 17.6) via `psql --single-transaction` (drop → baseline → seed, zero
> errors — a clean replay), migration ledger reset to this single baseline, and
> `src/types/database.types.ts` regenerated (`bunx tsc --noEmit` clean). A
> `pg_dump` backup was taken first.
