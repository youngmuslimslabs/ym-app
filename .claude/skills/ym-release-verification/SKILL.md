---
name: ym-release-verification
description: Verify a YM pull request or release before integration, accounting for stacked PRs, CI, database migrations and hosted configuration. Use when release readiness or rollout verification is requested.
---

# YM release verification

Read `CLAUDE.md`, current PR metadata/checks and the actual changed files. Use a
regular PR unless the user explicitly requests a draft. Creating or marking a PR
ready does not merge it, deploy it or apply SQL to the live database.

Check the stack first: a PR may target another feature branch, and green checks
there do not verify the final combined main branch. Identify prerequisite PRs
and include their order in the handoff. Do not retarget, merge or rewrite another
person's branch merely to obtain a green status.

Use the actual CI results for the current head. Standard app checks are lint,
TypeScript, dependency audit, Vitest coverage, build and Playwright. Run the new
database checks too when present. Distinguish existing warnings, new failures,
pending checks and checks blocked by missing environment configuration.

For database changes, read `ym-db-changes` and the migration itself:

- A baseline schema edit is not an incremental rollout to an existing database.
- Confirm the migration's prerequisites, a recovery plan, a usable backup and
  validation on an isolated target. Preserve the identity and role invariants.
- Check generated public types when the public interface changes.
- Keep actual database application separate from code merge. State what is
  committed, tested and applied; never mark an unapplied migration as live.

For hosted preview/backend work, confirm that Netlify and GitHub contexts point
to the intended isolated Supabase project. GitHub environment settings do not
configure Netlify automatically. Check GIS origin requirements for login.

Follow the user's actual authorization for external changes. When an action is
not authorized or requires unavailable credentials, finish the reviewable work
first and state the specific remaining action. A green local test is not a
hosted acceptance test, and a dependency-audit threshold does not establish that
all lower-severity advisories are resolved.

Link the PR, summarize behavior and validation, and keep issues open when external
setup, real data or acceptance remains. Update `docs/project-todos.md` with the
implemented work and its remaining rollout steps; avoid stale completion claims.
