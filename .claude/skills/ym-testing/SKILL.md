---
name: ym-testing
description: Plan or implement meaningful regression tests for YM behavior, particularly onboarding, profile saves and Supabase write paths. Use for testing work, not to add tests for every cosmetic or documentation edit.
---

# YM regression testing

Read `CLAUDE.md`, `package.json`, the relevant test files and the changed behavior.
Use the repository's Bun version and Node version from CI/Netlify. Check the actual
Node runtime when a test behaves differently locally; do not patch the application
just to accommodate a different runtime's browser-global behavior.

Start with the smallest regression that distinguishes correct behavior from the
failure. Existing patterns include `loadRoster.test.ts`, the profile-completion
tests and the Supabase client mocks. Reuse them when they fit.

For onboarding/profile writes, cover applicable outcomes:

- Insert or update the intended member and role/membership scope.
- A failed insert does not delete the previous state; retries do not duplicate it.
- Partial or missing query results are distinguished from a connection failure.
- Protected system roles survive the ordinary role-save flow.
- Nullable values, repeated submission and concurrent writes are handled by the
  database contract rather than inferred from a component test.

Mocked tests can establish payload/error behavior. They cannot prove RLS, function
permissions, unique constraints or transaction semantics. Use an isolated local
Postgres/Supabase instance for those checks, with ordinary member/admin identities;
assert both permitted and denied operations. Use the database regression workflow
if present on the branch. Do not direct test writes at the shared live project.

Typical commands (narrow the path to the relevant suite):

```sh
bunx vitest run path/to/changed.test.ts
bun run test:coverage
bunx tsc --noEmit
```

Run the relevant full checks after functional code changes, and repeat only when
new changes or failures invalidate earlier results. Coverage has exclusions; inspect
the changed files and do not lower thresholds or widen exclusions to get a pass.
Do not add tests that only assert wording, implementation structure or a reversible
style choice. Report which behavior was tested, which environment was used and any
integration path that remains unverified.
