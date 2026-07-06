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

The remote pre-prod DB still carries the old `00001`–`00019` ledger; it will be
**wiped and rebuilt from this baseline before real users onboard** (data is all
seed/fake; real users re-sync from Google Workspace). Until then, do **not**
`supabase db push` against remote — the ledgers diverge by design.

To rebuild from scratch (local, requires Docker):

```bash
supabase db reset   # applies 00001_initial_schema.sql, then ../seed.sql
```

> ⚠️ **Not yet replay-verified.** This baseline was assembled from live
> introspection but has not been applied to a fresh database (Docker was
> unavailable at squash time). Run `supabase db reset` on a local stack and
> confirm a zero-error replay before trusting it for the prod rebuild, then
> regenerate `src/types/database.types.ts` (`supabase gen types typescript`).
