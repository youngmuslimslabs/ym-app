---
name: ym-code-review
description: Review YM app pull requests or diffs for correctness, authorization and regression coverage. Use when a review is requested, rather than for unrelated routine edits.
---

# YM code review

Read the repository's `CLAUDE.md` and the actual PR base/head before reviewing.
Several YM PRs are stacked; use their declared base so inherited commits do not
become findings on the wrong PR. Verify that local files represent the current
head. Treat PR descriptions as claims to check against code and tests.

Prioritize the changed behavior and its callers:

- Supabase client filters and hidden UI controls are not authorization. Follow
  writes to RLS policies or SECURITY DEFINER functions and check both old-row
  `USING` and new-row `WITH CHECK` rules. Test SQL NULL behavior in predicates.
- An event-admin permission is a system-category role. A member's ordinary role
  editor must not grant, retag, delete or silently discard that permission.
- The shared Supabase project is live despite its “dev” name. A baseline edit
  does not alter a populated database. Distinguish committed SQL, applied SQL
  and regenerated public types. Use `ym-db-changes` for actual schema work.
- Trace multi-step saves through failure and retry. New inserts must succeed
  before obsolete records are deleted. Concurrent onboarding/submission paths
  need database constraints, not only a disabled button.
- Google login uses GIS `signInWithIdToken`; check Authorized JavaScript origins
  when diagnosing preview login. Do not propose OAuth redirect fixes for this flow.
- Follow read-only profile joins to their query. Avoid introducing a second
  client fetch just to resolve names already available through a join.
- In exception paths, telemetry must not suppress the return value. Route handlers
  flush PostHog before returning; member details must not enter events/logs.

For coverage, inspect relevant tests and the measured files, not just the global
percentage. `vitest.config.mts` excludes Supabase helpers from coverage; a passing
global threshold does not prove a changed write path was exercised. Look for a
failure-path assertion that would catch the defect, and note when integration
behavior cannot be established with mocks.

Run focused checks only where they help resolve a finding. Do not mutate the
database or fix code during a review-only request. Report actionable findings
with a precise changed-file location, failure scenario and consequence. Separate
confirmed bugs from unresolved questions; say when no actionable findings remain.
