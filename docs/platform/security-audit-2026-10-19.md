# Access-control audit (#82), 2026-10-19

Scope: main-branch migrations, application auth/server paths, CI/preview credential
handling, and direct-SQL regression tests on synthetic data. This is a repository
audit, not a claim about the deployed database. No live catalog, Auth settings,
secret values, infrastructure or member data was accessed.

## Findings and disposition

| Finding | Evidence | Disposition |
| --- | --- | --- |
| Organization read policies accepted any authenticated JWT | `is_authenticated()` checked only `auth.uid() IS NOT NULL`; an outside-domain Auth user has no linked app profile but passed this helper | Migration 00026 now requires a linked organization profile. Direct-SQL outsider/member tests pass. |
| Profile ownership allowed rewriting identity columns | Users UPDATE policy gated row ownership, with no immutability check for email/auth_id/claimed_at | Migration 00026 adds an invoker trigger. Tests reject email, auth linkage and claim timestamp changes, while allowing profile edits and service-role maintenance. |
| System role could be deleted or retagged by its owner | DELETE ownership-only; UPDATE protected only the new role category | Migration 00026 protects both old and new rows. Covers #47's delete delta and the update gap; coordinate review with that open PR. |
| Mutating RPCs inherited PUBLIC execute | PostgreSQL default function privileges; body checks already reject unauthorized callers | Migration 00026 revokes anonymous execution and explicitly grants authenticated/service-role access. Recovery test checks ACL preservation. |
| Preview configuration could inherit live database/administrative settings | Netlify previously used the same build command without target checks | #81 guard rejects the live project, mismatched public key and inherited admin credentials. GitHub E2E now requires the Preview environment and matching reference. Hosted setup remains pending. |
| Backup artifacts would expose data in this public repository | Proposed raw SQL artifact design in #60 | Workflow encrypts before upload; recovery private key stays outside GitHub. |

All 17 current public app tables enable RLS in the replayed migration chain. The
tests verify anonymous/outsider directory denial, permitted internal directory
reads, own/cross-user profile writes, self-grant prevention, system-role retention
and ordinary-role deletion. They are not exhaustive coverage of every policy.

## Dependency scan

`bun audit --audit-level=critical` passed on 2026-10-19. The high-severity scan
reported **46 high advisories**, including transitive `sharp` and `ws`, and build/
test tooling (`postcss`, `vite`, `rollup`, glob parsers and others). This is an
advisory count, not a count of confirmed exploitable application paths. Dependency
updates and image/realtime-path regression testing remain a separate remediation
item; this PR does not claim a clean high-severity scan or update the app lockfile.

Runtime candidates to triage first:
[sharp/libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj),
[sharp/libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c),
[ws fragment exhaustion](https://github.com/advisories/GHSA-96hv-2xvq-fx4p).
The current CI intentionally blocks critical advisories and reports high findings
without blocking; this audit preserves that policy.

## Outstanding verification and existing decisions

- Run `supabase/audits/access-inventory.sql` read-only against the hosted project
  and compare it with the tested migration chain. No database password was available
  for this session. Confirm the applied ledger, table grants and function ACLs,
  especially #47's outstanding production delta.
- Migration 00026 is **not applied**. Back up first, review with the security owner,
  apply to preview, verify member/admin flows, then apply atomically to live.
  It introduces no new public columns or RPC signatures, so generated types do
  not change. Existing historical identity/role inconsistencies need a separate
  data review; this migration does not rewrite member records.
- Check-in validation has pending work in PR #92 / migration 00025, including the
  NULL-code bypass and rate limiting. Do not duplicate or overwrite that function.
- Session check-in codes remain readable through direct session-table access by
  attendees, even though the app omits the column. The documented July 11 product
  decision accepted application-layer check-in/feedback enforcement. Record this
  limitation with the security owner. If that decision changes, isolate codes and
  enforce attendance/time/feedback eligibility in the database as one separate
  change; hiding a UI field does not provide a database boundary.
- Organization-wide staff PII visibility and self-selected non-system roles are
  existing product decisions, not newly imposed findings. Role collection #83
  does not establish an approval workflow by itself.
- Confirm Google provider restrictions, disabled-account handling, server-only key
  scoping, production environment reviewers and protected main outside this source
  audit. Do not paste secret values or member exports into issues/comments.

## Repeatable checks

`database-regression.yml` replays all committed migrations on PostgreSQL 17 and
runs permission/import/recovery tests without production credentials. The Auth
schema is a small test stub: it exercises PostgreSQL RLS and triggers, not Supabase
Auth provider behavior. Local verification used PostgreSQL 18; hosted CI targets
the current app server's PostgreSQL 17.

For manual replay on an **empty local** database:
`TEST_DATABASE_URL=postgresql://<local-user>@127.0.0.1:<port>/postgres bash scripts/platform/test-database.sh`
Then run the role importer integration test and `scripts/platform/test-backup.sh`
with that same environment. The scripts refuse non-local targets. Reusing a
populated database intentionally fails instead of resetting it.
