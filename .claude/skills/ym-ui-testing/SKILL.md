---
name: ym-ui-testing
description: Verify YM member/admin user journeys in a browser, including responsive behavior, saving, failure states and permissions. Use when browser testing or UI verification is requested.
---

# YM browser verification

Read `CLAUDE.md`, `playwright.config.ts` and the existing `e2e` helpers. Prefer the
project's Playwright tooling or an available browser tool. Use a local instance or
an isolated preview with designated test accounts for data-changing journeys.
The Supabase project whose reference is `todqvyzdvpnwuuonxwch` is the live/shared
project; its dashboard “dev” label is not permission to use it as a test fixture.

Verify the actual environment before testing. GIS login needs the exact browser
origin allowed in Google Cloud; a Supabase redirect wildcard does not solve it.
If sign-in or a required fixture is unavailable, exercise independent public paths
and report the blocked authenticated checks. Do not add a production auth bypass
or report a mocked sign-in as a completed browser journey.

Choose checks based on the requested behavior:

- Follow the whole affected journey: entry, action, loading, success, reload and
  persistence. Check recovery from a real or controlled failure when relevant.
- For member/admin differences, use separate designated accounts. Hiding the
  control in the browser does not establish database authorization.
- For profile edits, check the unsaved-changes guard and retention of existing
  roles/projects when the save fails.
- For conference changes, check the relevant live/grace/ended states and the
  conference timezone. Do not alter a device clock or live session to fake them.
- Use 375, 393, 430 and 1280px when responsive layout is affected. Check horizontal
  overflow, long names, keyboard focus, form errors and portaled sheets/dialogs.
- Ensure sheets close in the correct direction and preserve content during the
  exit transition when touching the session/comment sheet code.

Record useful evidence once after the flow works. Capture a new screenshot after
a visual fix, rather than repeatedly capturing unchanged screens. Remove only
fixtures created for this test. Describe observed behavior and untested paths;
do not infer a pass from a screenshot or a successful page load alone.
