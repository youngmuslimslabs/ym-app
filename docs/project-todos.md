# YM App — Product Roadmap

> **Immediate goal: get the app working to test live at a convention next weekend (~June 27–28).** Prioritize "does it work for real users" over full production hardening. Work top-down: items are ordered by priority within each tier (P0 → P2). Audit-surfaced items are tagged `[AUDIT]` with file:line references.

## Confirmed product decisions (do not relitigate)

- **Access is `@youngmuslims.com`-only, by design.** Every user has a youngmuslims.com Google account; no alumni/external login. The auth domain gate is correct, not a gap.
- **`legal-lol` route stays as-is.** No real legal/privacy pages.
- **PostHog is the error-monitoring + analytics tool.** No separate Sentry.
- **No communications plan.**
- **Intra-org PII visibility is acceptable.** Internal staff seeing each other's phone / personal email / ethnicity / DOB is fine; no field-level restriction needed.
- **Freeze deploys to `main` during the convention weekend.** Avoids the PWA service worker swapping versions in attendees' open sessions mid-check-in (the optional reload-prompt code fix stays at P2 #28).

## Data population model (how real data gets in)

There is **no bulk import** and **no data-model validation step**. Real org data enters three ways:

1. **Users** — created by the Google Workspace sync (`scripts/sync-google-users.ts`: writes email + first/last name + avatar) and/or on first login via the auth trigger. No manual user import. **Status: 1,823 real users already loaded in prod** — the sync has run.
2. **Roles + memberships** — **self-selected by each user during onboarding** (`onboarding.ts` saveStep3 = `role_assignments`, saveStep2 = membership). NOT imported. **Status: only ~8 memberships / ~18 role_assignments exist** — because real users can't place themselves until the real geography seed lands (#1).
3. **Geography (regions / subregions / neighbor_nets)** — **owner-maintained seed data** (P0 #1). **Status: STILL placeholder** in prod (1 region "Texas", 3 fake NNs). This is the top remaining blocker.

## Branching & Environments

Single environment — no `dev`/`staging`. Cut `feature/*` from `main`; test on the **Netlify deploy preview**; merge to `main` (production). **Host is Netlify** (`netlify.toml` is source of truth). Migrations apply directly to the one Supabase project — review carefully and **back up before applying** (P0 #7 / P1 #10).

---

# 🚀 MVP — Required to Launch

## P0 — Launch blockers (ordered by dependency / lead time)

1. **[P0] Update geography seed data with real values** — ⚠️ **THE top remaining blocker.** Prod still has only the placeholder Texas / Houston-Dallas / Katy-Sugar Land-Downtown seeds (`00004_seed_data.sql:64-97`, re-seeded in `00011_repair_dropped_tables.sql:169-189`). With 1,823 real users loaded but the real **regions → subregions → neighbor_nets** missing, **no one can pick their actual NeighborNet during onboarding** (only ~8 memberships exist as a result). Add the real hierarchy as a **new migration — next free number is `00018`** — that clears the placeholders and inserts the real rows, then apply with the same backup → dry-run → push → verify flow used for `00016`/`00017`. **Must land before users onboard** (a real membership pointing at a NN blocks deleting that NN). *Owner to provide the values.*

2. ✅ **[DONE] Privilege escalation — self-granted Event Admin** (PR #22, merged) — `00016` applied + **verified enforced on prod** (impersonation test rejected the self-grant). `WITH CHECK` on role_assignments INSERT/UPDATE excludes `category='system'`; `fetchRoleTypes()` filters system roles out of the picker. *Open follow-up: `people.ts:156` directory filter still lists "Event Admin" (read-only search; product decision — not a security issue).*

3. ✅ **[DONE] Broken migration history** (PR #24, merged) — `sort_order` moved into `00003`'s CREATE, redundant `ADD COLUMN` dropped from `00010`; the numbered sequence now matches `_run_all.sql`. *(Static-verified; a full fresh-replay against a shadow DB is still worth doing — see P1 #11.)*

4. ✅ **[DONE] Email case-sensitivity in the auth trigger** (PR #23, merged) — `00017` applied + verified on prod: **21 real users' uppercase emails normalized** (0 case-duplicates), `lower(email)` unique index added, trigger now matches + normalizes case-insensitively, sync script normalizes at the source.

5. ✅ **[DONE — rescoped] Onboarding write resilience** (PR #25, merged) — investigation found the resilience was **already built** (retry banner + `flushPendingSaves` blocks completion on a failed save). The real defect was a one-line banner that falsely claimed browser persistence — fixed. localStorage persistence + resume-to-last-step were cut as YAGNI for single-sitting onboarding. *Known limitation (left as-is): only the last failed background save is retried at completion (needs two failures in one session to bite).*

6. **[P0] Production OAuth + Google authorized origins** `[AUDIT]` — swap in prod Google OAuth credentials. Because login uses `signInWithIdToken` (Google Identity Services), the cutover dependency is the **Authorized JavaScript Origins** on the Google Cloud OAuth client (add `https://youngmuslims.com`), plus the Supabase Auth **Site URL** — not just redirect URIs.

7. **[P0] Custom domain — `youngmuslims.com` + pick ONE host** — **both Netlify *and* Vercel currently build every PR** (confirmed in CI); decide on a single host before cutover so DNS, SSL, and OAuth origins all point to one place. Then point the app at the YM domain; provision SSL; update OAuth origins (#6). `[AUDIT]` Reconcile `trailingSlash: true` with registered redirect URIs and the manifest `start_url`/shortcuts to avoid `redirect_uri_mismatch`; review `netlify.toml` `publish = ".next"` against the Next.js Runtime v5 (re-test `/auth/callback` on a deploy preview).

8. **[P0] Confirm Supabase Pro tier** `[AUDIT]` — a Free-tier project **auto-pauses after ~7 days of inactivity** (prod goes fully offline) and has no PITR. Confirm Pro in the dashboard before the convention; this also enables daily backups for P1.

9. **[P0] Manual RLS policy review** — ✅ the role self-assignment path (#2) is now **verified enforced on prod**. **Still open:** the `check_in_code` column read by attendees (`00013:421-430` — column-stripping in the query is cosmetic, so any attendee can read every session's check-in code and forge check-ins). Re-sweep the rest against real users once more onboard.

10. **[P0] End-to-end auth flow test** — manual, owner-assigned gate: confirm sign-in → onboarding (roles + membership saved) → directory works on the prod domain with a real account, immediately before go-live.

## P1 — Required for a safe, credible launch

11. **[P1] Database backups + migration safety** `[AUDIT]` — confirm daily backups (needs Pro, #8); **document and rehearse one restore end-to-end**. Add a shadow-DB step (apply the full migration set to a throwaway Postgres on each PR) so ordering/idempotency breaks fail before prod, and write a per-migration rollback procedure. *With one environment, a bad direct-to-prod migration has no safety net.*

12. **[P1] Automated tests for the write paths** `[AUDIT]` — onboarding is now the sole source of roles/memberships, so this is high-value. Using the proven `loadRoster.test.ts` client-mock pattern, add a vitest suite for `onboarding.ts` (assert exact insert/update payloads per step — `saveStep3` role_assignments incl. end_date nulling, `saveStep2` membership update-vs-insert, `completeOnboarding`) and for `profileService.saveProfile` (upsert payload shape; deletes only after successful upsert). Remove `src/lib/supabase/**` from the coverage exclude for `onboarding.ts`.

13. **[P1] Verify home / finance / docs content** `[AUDIT]` — *these are fully-built, shipping features, NOT stubs.* Do **not** hide or stub. Verify content is current: finance officers/dates (`FINANCE_DEPARTMENT.cfo`), the Jotform form ID, and the SOP/Drive links (link rot).

14. **[P1] Fix user-visible correctness bugs:**
    - `loadRoster` drops users who checked in but never signed up (`loadRoster.ts:49`)
    - `roomConflict` false-positive overlap warnings from an ISO format mismatch (`SessionPanel.tsx:473`)

15. **[P1] Directory pagination + scale** `[AUDIT]` — `fetchPeopleForDirectory` runs `.from('users').select('*')` with no pagination and filters client-side; won't scale once the Google sync loads the full org. Add server-side pagination + search (`range()` + `ilike`/FTS), select only the columns the list needs, and load-test `/people` with thousands of seeded rows.

16. ✅ **[DONE] PostHog — analytics + error monitoring** (PR #28, pending merge) — full suite wired: event tracking (onboarding funnel, profile, people directory, admin), error capture (`instrumentation.ts` `onRequestError` + `error.tsx` + `global-error.tsx`), session replay (all sessions, console logs enabled), user identity (`identify`/`reset` in `AuthContext`), OTel logs to PostHog Logs (`src/lib/posthog/logger.ts`). Middleware errors replaced. `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` needed in Netlify env vars. *Follow-up items: see P2 #30–#33.*

17. **[P1] Security headers / CSP** `[AUDIT]` — add a `headers()` block (next.config or `netlify.toml [[headers]]`): `X-Frame-Options: DENY` / `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS, and a CSP allowing self + the Supabase URL for `connect-src`.

18. **[P1] Branded 404** `[AUDIT]` — add `not-found.tsx`; today `notFound()` (deleted/stale conference links) renders Next's bare 404 outside the app shell with no way back.

19. **[P1] Mobile QA pass** — verify 375 / 393 / 430px; fix admin `grid-cols-2` desktop-only layout (`ScheduleEditor.tsx:193`) and the `/finance` Jotform 4000px iframe height on mobile.

20. **[P1] Branch protection on `main`** — make the existing CI gate blocking (it already runs lint + tsc + audit + vitest + build + Playwright): require passing CI + 1 review, no direct pushes.

21. **[P1] Root `README.md`** — setup, env vars, contributor onboarding.

22. **[P1] PWA manifest + CI Node pin** `[AUDIT]` — add the two missing `/screenshots/*.png` (or remove the block) and fix `theme_color` to `#254FA0` in `manifest.json`; pin CI Node to match `netlify.toml` `NODE_VERSION=20`.

## P2 — Strongly recommended (descope only if the week forces it)

23. **[P2] Manual onboarding smoke test** — run all 7 steps with a real account, confirming roles + membership land correctly; include a deliberately interrupted/failed-write run.
24. **[P2] Accessibility quick pass** — keyboard nav + obvious screen-reader gaps on auth, onboarding, directory.
25. **[P2] Block client-set onboarding flag** `[AUDIT]` — the `users` UPDATE policy has no `WITH CHECK`, so a user can PATCH `onboarding_completed_at` directly (self-inflicted only). Add a `WITH CHECK`/trigger.
26. **[P2] Avatar URL rot** `[AUDIT]` — Google photo URLs in `avatar_url` expire; unclaimed members' avatars will 404 over time. Copy to Supabase Storage at sync time or resolve live; verify the initials fallback.
27. **[P2] Audit trail for destructive admin actions** `[AUDIT]` — `remove_attendee` (SECURITY DEFINER cascade), role grant/revoke, and conference publish are unlogged. Add an insert-only audit table (actor, action, target, timestamp).
28. **[P2] Service-worker update UX** `[AUDIT]` — `sw.js` `skipWaiting()`+`clients.claim()` swaps JS in open tabs mid-session with no reload prompt. Add a "new version — reload" toast (Sonner is global). *Mitigated for the convention by the deploy freeze (see Confirmed decisions).*
29. **[P2] Bulk email copy** `[AUDIT]` — `CopyEmailsButton` copies every member's email in one click. Internal-staff directory, so likely fine; decide keep vs remove.

30. **[P2] PostHog — remove noisy middleware_request log** — `logger.info('middleware_request')` fires on every page load (`src/lib/supabase/middleware.ts`). With 1,800 users this generates enormous log volume. Remove it; only log WARN/ERROR paths (domain rejections, auth failures, DB errors) which are already wired.

31. **[P2] PostHog — add `forceFlush()` to all route handlers** — serverless functions (Netlify) may freeze before `posthog-node` flushes its event queue. Already done in `sync-google-users/route.ts`; audit any future route handlers that call `getPostHogServer().capture()` and add `await getPostHogServer().flush()` before each `return`. (`SimpleLogRecordProcessor` in the logger sends synchronously — no flush needed there.)

32. **[P2] PostHog — upload source maps for error tracking** — minified prod bundles produce unreadable stack traces in PostHog Error Tracking. Add a build step to upload source maps: `bunx posthog-cli sourcemaps upload --directory .next`. Requires a PostHog personal API key (not the project token) in CI env vars.

33. **[P2] PostHog — set up onboarding funnel dashboard** — create a Funnel insight in PostHog using `onboarding_step_completed` (steps 1–6) → `onboarding_completed` to see where users drop off. This is the highest-value analytics view post-launch.

---

# 🔮 Future Roadmap (post-MVP)

## Quality & Test Hardening (begin right after launch)

- Authenticated onboarding E2E (un-skip `e2e/onboarding.spec.ts:29`) — **first item post-launch**; every merge to prod is unguarded until then. Needs a seeded test user + `storageState` fixture.
- Authenticated auth E2E — signed-in redirects, domain validation (un-skip `e2e/auth.spec.ts:61`)
- Component tests for onboarding steps 2–5, 7
- Raise coverage thresholds toward 80% (currently floored at ~3% in `vitest.config.mts`; ratchet up as tests land)
- Bundle-size check in CI (warn on significant growth)

### Remaining admin-schedule findings (smaller / latent)

- `composeTzIso` DST spring-forward off-by-one writes the wrong UTC instant (US tz, 02:00–07:00 second Sunday of March) — pinned `it.skip` in `datetime.test.ts` (`datetime.ts:19`)
- `pendingSavedId` can clobber deliberate navigation between save and refresh (`ScheduleEditor.tsx:79`); also needs a timeout fallback (`ScheduleEditor.tsx:73`)
- Dirty flag stays true after a successful save until refresh → spurious discard dialog (`SessionPanel.tsx:411`)
- DeleteMode async promise not cancelled on unmount (`SessionPanel.tsx:821`)
- `dateOk` silently disables Save with no field-level error (`SessionPanel.tsx:445`)
- `endTime > startTime` string compare disallows midnight-crossing sessions (`SessionPanel.tsx:448`)
- Header "Add session" button no-ops on non-Schedule tabs (`ConferenceEditor.tsx:133`)
- Focus regression on mode transitions (`SessionPanel.tsx:401`)
- `onDirtyChange` dual-effect pattern is fragile (`SessionPanel.tsx:411,416`)
- `loadRoster` dead `.order('created_at')` clause (`loadRoster.ts:22`)
- `SessionPanel.test.tsx` roster-filter test asserts the loading frame (`SessionPanel.test.tsx:49`)

## UI / UX Polish

- **Wire up dark mode toggle** — `darkMode: ['class']` + dark OKLCH tokens exist, but nothing adds the `dark` class to `<html>`. Needs `next-themes` or a hand-rolled toggle.
- Finalize loading/error state patterns across the app
- Onboarding motion & transitions (use the `frontend-design` skill): page transitions, step 7 celebration, segmented step indicator, step 1 welcome reveal, micro-interactions
- PWA: test standalone mode on iOS Safari; consider splash screen config; revisit `IOSInstallPrompt` (animations, timing, analytics)
- `SearchableCombobox`: always show a persistent "Add custom…" option; placeholder hint

## New Features

- **Org Chart** — visual hierarchy explorer (separate from the directory)
  - Option A: geographic only (Region → Subregion → NN); Option B: scoped by track (Geographic / Cabinet / Cloud)
  - Handle cross-cutting roles (NS members hold multiple functional roles); navigation TBD

## Exploratory Spikes (research / ideation — no implementation yet)

- **Employment data integration** — referral network across members' companies (LinkedIn API limits, privacy/GDPR)
- **Collective social media feed** — unified Instagram feed across NeighborNets (API restrictions, moderation)
- **User engagement & retention** — social features, gamification, community features, personal value (prayer times, masjid info), notifications

---

## Recently shipped / corrections

- **2026-06 prod migration drop** — `00015` (conferences polish; **prod had been silently missing it**), `00016` (privilege-escalation fix), `00017` (email-casing fix) applied to prod via `supabase db push` and **verified live**. Remote ledger now at `00017`. PRs #22–#25 merged to `main`. Pre-apply backups at `/tmp/ym_prod_public_backup.sql` + `/tmp/ym_emails_pre_normalize.csv`.
- ⚠️ **Operational follow-up: rotate the Supabase DB password + Personal Access Token** (exposed during the migration session). Note: resetting the DB password means re-linking the CLI.
- Resolved: local jsdom CJS load error — the `lru-cache` override in `package.json` fixed it; the full vitest suite runs clean locally.
- **CI already runs the full gate** — lint + tsc + `bun audit` + `vitest --coverage` + `next build` + Playwright e2e (`ci.yml`). The remaining gap is making it *blocking* (P1 #20), not adding steps.
- 4 silent-data-loss holes in the admin schedule editor; color-coded role badge variants (PR #21); iOS Safari install banner (`IOSInstallPrompt`)
