# YM App — Product Roadmap

> **Immediate goal: get the app working to test live at a convention on ~July 14 2026 (2 weeks away).** Prioritize "does it work for real users" over full production hardening. Work top-down: items are ordered by priority within each tier (P0 → P2). Audit-surfaced items are tagged `[AUDIT]` with file:line references.

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
3. **Geography (regions / subregions / neighbor_nets)** — **owner-maintained seed data** (P0 #1). **Status:** placeholders removed in the 2026-07 squash; `seed.sql` now seeds `role_types` only. Real geography still owner-pending — the top remaining blocker.

## Branching & Environments

Single environment — no `dev`/`staging`. Cut `feature/*` from `main`; test on the **Netlify deploy preview**; merge to `main` (production). **Host is Netlify** (`netlify.toml` is source of truth). Migrations apply directly to the one Supabase project — review carefully and **back up before applying** (P0 #7 / P1 #10).

---

# 🚀 MVP — Required to Launch

## P0 — Launch blockers (ordered by dependency / lead time)

> **⭐ [P0 · TOP PRIORITY — FINAL GO-LIVE TASK] Set up all data for the YMLC conference — conference is ~2026-07-12 (5 days out, as of 2026-07-07).** Stand up everything the app needs to run the conference live: the `conferences` row (scope / dates / timezone), its `sessions` + schedule, and any attendee/roster setup. This is the **last** task to execute — do it immediately before the conference, *after* every upstream dependency is in place:
> - **Geography seed** (#1 below) — ✅ **DONE:** PR #33 **merged** (git `b6e86f8`); DB verified live 2026-07-08 = **4 regions / 22 subregions / 118 neighbor_nets**.
> - **Google Workspace sync re-run** — ✅ **DONE:** `users` verified at **1,826 rows** 2026-07-08 (sync has run). Note only **2** rows have a non-null `auth_id` (i.e. have logged in + been linked); the rest self-heal on first login.
> - **Roles / memberships** — self-selected during onboarding; NNC/leadership seeding (see the deferred `role_assignments` follow-up) also depends on the sync.
>
> Treat this as the final data-readiness checklist for go-live.

1. **[P0] Real geography seed + prod DB clean before convention** — (a) **Geography seed** ✅ **[DONE]** via PR #33 (merged, git `b6e86f8`); verified live 2026-07-08: **4 regions / 22 subregions / 118 neighbor_nets** seeded. Onboarding NeighborNet selection is now unblocked. (b) **DB wipe scope** — ⚠️ **still open (decision).** Live counts 2026-07-08: **86 role_assignments, 2 memberships, 0 conferences** (mostly test-account data). Decide whether to wipe the test role_assignments/memberships; the **1,826** Google-sync'd real users should stay. **Back up prod before any wipe.** (A real membership pointing at a NN blocks deleting that NN.)

2. ✅ **[DONE] Privilege escalation — self-granted Event Admin** (PR #22, merged) — `00016` applied + **verified enforced on prod** (impersonation test rejected the self-grant). `WITH CHECK` on role_assignments INSERT/UPDATE excludes `category='system'`; `fetchRoleTypes()` filters system roles out of the picker. *Open follow-up: `people.ts:156` directory filter still lists "Event Admin" (read-only search; product decision — not a security issue).*

3. ✅ **[DONE] Broken migration history** (PR #24, merged) — `sort_order` moved into `00003`'s CREATE, redundant `ADD COLUMN` dropped from `00010`; the numbered sequence now matches `_run_all.sql`. *(Static-verified; a full fresh-replay against a shadow DB is still worth doing — see P1 #11.)*

4. ✅ **[DONE] Email case-sensitivity in the auth trigger** (PR #23, merged) — `00017` applied + verified on prod: **21 real users' uppercase emails normalized** (0 case-duplicates), `lower(email)` unique index added, trigger now matches + normalizes case-insensitively, sync script normalizes at the source.

5. ✅ **[DONE — rescoped] Onboarding write resilience** (PR #25, merged) — investigation found the resilience was **already built** (retry banner + `flushPendingSaves` blocks completion on a failed save). The real defect was a one-line banner that falsely claimed browser persistence — fixed. localStorage persistence + resume-to-last-step were cut as YAGNI for single-sitting onboarding. *Known limitation (left as-is): only the last failed background save is retried at completion (needs two failures in one session to bite).*

6. ✅ **[DONE] Production OAuth + Google authorized origins** — prod domain added to **Authorized JavaScript Origins** on the Google Cloud OAuth client and the Supabase Auth **Site URL** updated. Because login uses `signInWithIdToken` (Google Identity Services), JS-origins were the only cutover dependency — no redirect URIs involved.

7. ✅ **[DONE] Custom domain + single host** — **Netlify** chosen as the sole host; app served at **`app.youngmuslims.com`** (subdomain, not apex) with DNS managed via Squarespace and SSL provisioned. OAuth origins updated to match (#6).

8. ✅ **[DONE] Upgrade Supabase to Pro tier** `[AUDIT]` — ⚠️ **Confirmed FREE in the dashboard 2026-06-30** (project `ym-app-dev`) — this is now a hard blocker, not just a check. A Free-tier project **auto-pauses after ~7 days of inactivity** (prod goes fully offline) and has no PITR. **Before upgrading, verify `ym-app-dev` is the same project the prod Netlify env (`NEXT_PUBLIC_SUPABASE_URL`) points at** — the URL Config in #7 was set on `ym-app-dev`, so if prod points elsewhere that work landed on the wrong project. Upgrading also enables daily backups for P1.

9. **[P0] Manual RLS policy review** — ✅ the role self-assignment path (#2) is now **verified enforced on prod**. **Still open:** the `check_in_code` column read by attendees (`00013:421-430` — column-stripping in the query is cosmetic, so any attendee can read every session's check-in code and forge check-ins). Re-sweep the rest against real users once more onboard.

10. **[P0] End-to-end auth flow test** — manual, owner-assigned gate: confirm sign-in → onboarding (roles + membership saved) → directory works on the prod domain with a real account, immediately before go-live. *Update (this session): the sign-in → onboarding **save** path was verified on prod — the `auth_id`-link bug (#37) that made every save fail is fixed (the failing `auth_id` lookup went 406 → 200). Full gate still open: needs geography seed (#1) so roles + membership can actually be picked, then a real end-to-end run before go-live.*

36. **[P0] Reassess + simplify onboarding flow** — ⚠️ **Convention July 14 2026 (2 weeks).** Current 7-step flow is too clunky and long for first-time users at the convention. **Scope cap:** identify which steps can be combined or cut to reach ≤ 4 steps; get owner sign-off on the reduced flow before implementing. Do not redesign open-endedly.

37. ✅ **[DONE] Onboarding saves failed — `auth_id` never linked** (PR #29, merged + verified in prod) — root-caused live: onboarding writes call `getUserId(auth_id)`, but `public.users.auth_id` was `NULL` for any user whose row was (re)synced after their first login. The `on_auth_user_created` trigger only links on the **first-ever** `auth.users` insert, so returning/re-synced users never got re-linked → `getUserId` returned 0 rows (**406 / PGRST116** → "User not found") → every save hit the generic failure banner. Fix: service-role self-heal in middleware (`claimUserByEmail`, `src/lib/supabase/claim-user.ts`) links the row by normalized email on the next request — required because RLS (`auth_id = auth.uid()`) blocks a client-side link on a `NULL`-`auth_id` row. Also closed the telemetry gap: `onboarding_error` now fires on the previously-silent `{success:false}` save/flush paths (error strings only, no PII). Verified end-to-end on prod — the failing `auth_id` lookup returns 200 and onboarding saves succeed. *Scope note: self-heal covers `NULL` `auth_id` only; a row with a stale/mismatched `auth_id` is a separate case.*

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
25. **[P2] Block client-set onboarding flag** `[AUDIT]` — the `users` UPDATE policy has no `WITH CHECK`, so a user can PATCH `onboarding_completed_at` directly (self-inflicted only). Add a `WITH CHECK`/trigger. *Migration written (`supabase/migrations/00002_users_onboarding_immutable.sql`): `BEFORE UPDATE OF onboarding_completed_at` trigger silently preserves OLD when already set (retries of `completeOnboarding` are no-ops instead of raising), and a `BEFORE INSERT` trigger forces the column to NULL on first row create. **Still pending: apply to remote** via native `psql` (see the ym-db-changes skill). Scope note: this blocks rewriting/clearing the flag, not premature setting — the legit completion path is still NULL → now() from the client, so the "user marks themselves complete before finishing steps" edge is not covered by this migration.*
26. **[P2] Avatar URL rot** `[AUDIT]` — Google photo URLs in `avatar_url` expire; unclaimed members' avatars will 404 over time. Copy to Supabase Storage at sync time or resolve live; verify the initials fallback.
27. **[P2] Audit trail for destructive admin actions** `[AUDIT]` — `remove_attendee` (SECURITY DEFINER cascade), role grant/revoke, and conference publish are unlogged. Add an insert-only audit table (actor, action, target, timestamp).
28. **[P2] Service-worker update UX** `[AUDIT]` — `sw.js` `skipWaiting()`+`clients.claim()` swaps JS in open tabs mid-session with no reload prompt. Add a "new version — reload" toast (Sonner is global). *Mitigated for the convention by the deploy freeze (see Confirmed decisions).*

38. **[P2 · POST-LAUNCH] CSP: drop `'unsafe-inline'` + `'unsafe-eval'` via nonce middleware** — the CSP added in `netlify.toml` keeps both unsafe-* in `script-src` because Next.js App Router relies on inline flight scripts. This nullifies the XSS-mitigation value of the CSP: the other allowlisted origins (Google GSI, PostHog, Jotform, Supabase) are moot while inline scripts execute freely. Fix: generate a per-request nonce in `src/middleware.ts`, stamp it on every `<Script>` tag (Next.js supports this via `experimental.nonce`), and rewrite the CSP response header to `script-src 'nonce-<value>' 'strict-dynamic' …` instead of `'unsafe-inline' 'unsafe-eval'`. Moves the CSP out of static `netlify.toml` and into the app so it travels with the code and can be composed from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_POSTHOG_HOST` for exact-host allowlisting (a follow-up to the current wildcard `*.supabase.co` / `*.posthog.com` compromise). Larger change than a header edit — deferred until post-convention.
29. **[P2] Bulk email copy** `[AUDIT]` — `CopyEmailsButton` copies every member's email in one click. Internal-staff directory, so likely fine; decide keep vs remove.

30. ✅ **[DONE] PostHog — remove noisy middleware_request log** — removed from `src/lib/supabase/middleware.ts` (PR #29).

31. ✅ **[DONE] PostHog — `forceFlush()` in route handlers** — only `sync-google-users/route.ts` calls `getPostHogServer()` and it already flushes before every return. No other route handlers to audit.

32. ✅ **[DONE] PostHog — source maps upload** (PR #29) — `productionBrowserSourceMaps: true` in `next.config.ts`; production build runs `(posthog-cli sourcemaps inject && upload || true) && find .next -name '*.map' -delete` — upload is non-fatal (graceful degradation if key is missing), maps are always deleted from the deploy artifact regardless. `posthog-cli@0.2.4` pinned in `devDependencies`. **Action required:** add `POSTHOG_CLI_PERSONAL_API_KEY=phx_...` to Netlify environment variables (PostHog → Settings → Personal API keys — different from the project token).

33. **[P2] PostHog — set up onboarding funnel dashboard** — manual PostHog UI task. Steps: (1) PostHog → Insights → New insight → Funnel; (2) Add step: event `onboarding_step_completed` filtered by `step = 1`, label "Step 1"; repeat for steps 2–6; (3) Add final step: event `onboarding_completed`, label "Complete"; (4) Set date range to "Since launch"; (5) Save as "Onboarding Funnel". This is the highest-value analytics view post-launch.

34. *(Merged into #1 — convention deadline + DB wipe scope folded there.)*

35. *(Merged into #1 — Google Sheet URL and migration number folded there.)*

36. *(Moved to P0 section.)*

---

## QA sweep findings (2026-07-08) — see `docs/qa/findings-2026-07-08.md`

Full authenticated click-through (desktop 1280 + mobile 393, negative tests) on `feature/app-qa-testing`. Re-runnable script at `docs/qa/manual-test-plan.md`. Highlights (10 findings; none S1):

- **[S2] Profile inline fields don't commit on Tab/blur** (`InlineEditField.tsx`) — only Enter / mouse-click-outside commit; keyboard users get stuck and lose edits. Convention-relevant (mobile keyboards). *Onboarding is unaffected — it uses standard inputs.*
- **[S3] Role/project start dates accept future dates** while marked "Current"/"ongoing" (e.g. "Mar 2030 – Present"). Add ≤-today constraint + end≥start.
- **[S3] PWA manifest**: two `screenshots` 404 (console error every page) + `theme_color` `#3b5ba5` not brand `#254FA0` → folds into **P1 #22**.
- **[S3] Profile a11y**: 16 unlabeled inputs / 4 missing id-name (`InlineEditField` label not wired) → **P2 #24**.
- **[S3] Finance Jotform** fixed 2,781px iframe height on mobile (no auto-resize) → **P1 #19**.
- **[S4] Nits**: `/admin` denies with no feedback; person not-found header says "Error"; directory toolbar hidden at mobile width; duplicate `auth_id→id` query on `/people`.
- **Passed**: phone validation (letters stripped, incomplete blocked with inline error), gibberish search empty state, bad/malformed-UUID profile not-found (no 500), DOB date bounds.
- **Coverage gaps** (blocked): admin/conference editor (account not event-admin), attendee conference view (0 conferences), live onboarding walkthrough (already onboarded + read-only DB MCP), logout (would kill the manual-login session).

### Decisions to consider (surfaced by the QA sweep — owner's call, not bugs)

- **[CONSIDER] Admin access model + denied-access feedback (was F-06).** `/admin` correctly redirects non-admins to `/home`, but silently. Two open questions: (a) *which roles* should have admin — e.g. should Sub-Regional Secretary General see it at all, or only Event Admins? and (b) should a denied direct-navigation to `/admin` show a "you don't have access" toast instead of a silent bounce? Today only someone typing the URL hits this (no nav link for non-admins). Decide the intended privilege model before adding any feedback.
- **[CONSIDER] Directory filtering on mobile (was F-09).** The `/people` toolbar (Filter, card/table toggle, Copy emails) is intentionally hidden below the mobile breakpoint (`{!isMobile && …}`) — only Search shows. Given the convention is phone-heavy, decide whether attendees should be able to **filter** the directory on a phone (search alone may be enough, or Filter could move into a bottom-sheet/drawer). Purely a UX scope call.

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
- **Home "Who you are" — many-role overflow** `[LOW]` — `home/page.tsx:50` renders all active roles as a single `join(' · ')` line with no truncation/wrap strategy. Works as designed today; only a concern if a member holds many roles (long run-on line on narrow screens). Decide truncation vs wrap-to-chips if it ever looks bad. *(Noted from Ali Ilyas feedback re: multiple roles, 2026-07-08.)*
- Finalize loading/error state patterns across the app
- Onboarding motion & transitions (use the `frontend-design` skill): page transitions, step 7 celebration, segmented step indicator, step 1 welcome reveal, micro-interactions
- PWA: test standalone mode on iOS Safari; consider splash screen config; revisit `IOSInstallPrompt` (animations, timing, analytics)
- `SearchableCombobox`: always show a persistent "Add custom…" option; placeholder hint
- **Rename "Ethnicity" → "Nationality" + comprehensive list (soft-suggestion combobox)** — *(Ali Ilyas feedback, 2026-07-08.)* Current field is mislabeled and Arab/South-Asian-centric (27 hardcoded entries, missing American, Bosnian, Mexican, etc.). **Decisions made:** (1) relabel the concept **"Nationality,"** (2) seed with **nationalities/demonyms only** — skip stateless/pan-ethnic self-identifiers (Kurdish, Bosniak, Amazigh, Uyghur, etc.) as too niche, (3) present as a **combobox where the list is a soft suggestion** (type-ahead + free entry allowed), (4) **keep the column `TEXT`** — do *not* convert to a Postgres enum (closed set → migration per value, fights inclusivity); a managed `nationalities` lookup table is the only worthwhile upgrade and only if admins ever need to edit the list in-app. **Cleanup owed regardless of approach:** the list is currently **duplicated verbatim** in `onboarding/step1-personal-info.tsx` and `profile/components/PersonalInfoSection.tsx` — extract to one shared constant. **Deferred on purpose:** onboarding is being reworked, so the *implementation* (which step, which component) may change — do not pre-build a spec; revisit when onboarding lands. Seed list (~190 demonyms, alphabetical) to use:
  > Afghan, Albanian, Algerian, American, Andorran, Angolan, Antiguan, Argentine, Armenian, Australian, Austrian, Azerbaijani, Bahamian, Bahraini, Bangladeshi, Barbadian, Belarusian, Belgian, Belizean, Beninese, Bhutanese, Bolivian, Bosnian, Botswanan, Brazilian, British, Bruneian, Bulgarian, Burkinabé, Burmese, Burundian, Cambodian, Cameroonian, Canadian, Cape Verdean, Central African, Chadian, Chilean, Chinese, Colombian, Comoran, Congolese, Costa Rican, Croatian, Cuban, Cypriot, Czech, Danish, Djiboutian, Dominican, Dutch, East Timorese, Ecuadorian, Egyptian, Emirati, Equatorial Guinean, Eritrean, Estonian, Ethiopian, Fijian, Filipino, Finnish, French, Gabonese, Gambian, Georgian, German, Ghanaian, Greek, Grenadian, Guatemalan, Guinean, Guinea-Bissauan, Guyanese, Haitian, Honduran, Hungarian, Icelandic, Indian, Indonesian, Iranian, Iraqi, Irish, Israeli, Italian, Ivorian, Jamaican, Japanese, Jordanian, Kazakh, Kenyan, I-Kiribati, Kosovar, Kuwaiti, Kyrgyz, Laotian, Latvian, Lebanese, Basotho, Liberian, Libyan, Liechtensteiner, Lithuanian, Luxembourgish, Macedonian, Malagasy, Malawian, Malaysian, Maldivian, Malian, Maltese, Marshallese, Mauritanian, Mauritian, Mexican, Micronesian, Moldovan, Monégasque, Mongolian, Montenegrin, Moroccan, Mozambican, Namibian, Nauruan, Nepali, New Zealander, Nicaraguan, Nigerien, Nigerian, North Korean, Norwegian, Omani, Pakistani, Palauan, Palestinian, Panamanian, Papua New Guinean, Paraguayan, Peruvian, Polish, Portuguese, Qatari, Romanian, Russian, Rwandan, Saint Lucian, Salvadoran, Samoan, San Marinese, São Toméan, Saudi, Senegalese, Serbian, Seychellois, Sierra Leonean, Singaporean, Slovak, Slovenian, Solomon Islander, Somali, South African, South Korean, South Sudanese, Spanish, Sri Lankan, Sudanese, Surinamese, Swazi, Swedish, Swiss, Syrian, Taiwanese, Tajik, Tanzanian, Thai, Togolese, Tongan, Trinidadian, Tunisian, Turkish, Turkmen, Tuvaluan, Ugandan, Ukrainian, Uruguayan, Uzbek, Vanuatuan, Venezuelan, Vietnamese, Yemeni, Zambian, Zimbabwean, Other

## New Features

- **Org Chart** — visual hierarchy explorer (separate from the directory)
  - Option A: geographic only (Region → Subregion → NN); Option B: scoped by track (Geographic / Cabinet / Cloud)
  - Handle cross-cutting roles (NS members hold multiple functional roles); navigation TBD
- **Project collaborators / members** — let a project owner add *other people* to their YM projects (beyond the single owner today), so a project shows its full team. *(Ali Ilyas feedback, 2026-07-08.)* Needs: a project↔user junction (or reuse `role_assignments` scoped to the project) + a people-picker in the project section + read-only display of collaborators on the profile/people views. Explore data model before building — decide whether this is a `role_assignments` scope or a dedicated `project_members` table.

## Deferred schema ideas (from `db-schema-proposal.md` review — very low priority)

- **`forms` table (generic form definitions)** — deferred; no consumer today. Intended for future in-app forms (registration/intake/custom questionnaires) once a feature actually needs them. **Do not** build the proposal's `question_1, question_2, …` shape (repeating-column anti-pattern); when built, use a `forms` + `form_questions` child table (or a `questions JSONB` column), following the existing `users.education` JSONB precedent. Revisit if/when session_feedback needs to generalize beyond a 1–5 rating + comment.
- **`locations` table (reusable event locations)** — deferred; `conferences.location` is free `TEXT` today and that's fine at current scale (0 conferences in prod). When built: `id`, `name`, `address`, `point_of_contact_{name,phone,email}`, timestamps, and a `conferences.location_id` FK. Pure normalization win, no data migration risk while conference tables are empty.
- **[REFACTOR — post-convention, isolated PR] Rename all primary keys `id` → `<entity>_id`.** Make PKs descriptive (`regions.id` → `region_id`, `users.id` → `user_id`, etc.) for consistency with the already-descriptive FK columns. **Do NOT do this before the July convention** and **never mix it into a schema/feature batch** — it's a repo-wide sweep, not a quick change. Blast radius (measured 2026-07-06): **543 `id` references across 74 source files**, **114 references in migrations** (PK defs, every FK constraint, all RLS policies, SECURITY DEFINER functions), plus the auth-critical `users` table (1,826 rows). Approach: one dedicated branch → rename PKs + rewrite dependent FKs/policies/functions in a single migration → regenerate `database.types.ts` → sweep all app-code `.eq('id')`/`select('id')`/`.id` refs → full CI (lint + tsc + vitest + e2e) green before merge. Must be **uniform** across all tables (half-renamed is worse than either). Note: PostgREST embeds survive (they key off FK constraints, not column names), but `id` is the Supabase default so this is swimming upstream — low functional benefit, do it only if the consistency is worth the churn. *A subagent can execute the mechanical sweep once the migration shape is decided.*
- **[CABINET CLUSTER — schema done, feature + data still deferred]** Naming + structure are now in the `00001_initial_schema.sql` baseline (2026-07-06 squash); the Cabinet *feature* (UI, rosters) and real data remain deferred. Decisions (resolved — do not relitigate):
    - **Two-table structure** — `cabinet_departments` + `cabinet_teams` stay separate tables (two-level hierarchy: department heads *and* team heads).
    - **Leadership + rosters are `role_assignments`, not columns.** Seed roles already cover it: **Cabinet Team Lead** (`scope_type=cabinet_team`, max 1), **Cabinet Team Member** (`cabinet_team`, unlimited), **Cabinet Department Head** (`cabinet_department`, max 1). "Who leads team X" / "team X roster" = role_assignments with `scope_id` = the team id. So **no** scalar head/member columns and **no `team_members` junction**.
    - **Naming applied** in the baseline + `seed.sql`: `cabinet_departments`/`cabinet_teams` tables, `cabinet_department`/`cabinet_team` scope_type values, "Cabinet Department Head" role. Geography names unchanged.
    - **[ACTION when org data available]** Get the real Cabinet department → team structure from the owner and add it to `supabase/seed.sql` alongside the geography seed, using the `cabinet_*` names. *Blocked on: owner providing the real department/team list.*

## Exploratory Spikes (research / ideation — no implementation yet)

- **Employment data integration** — referral network across members' companies (LinkedIn API limits, privacy/GDPR)
- **Collective social media feed** — unified Instagram feed across NeighborNets (API restrictions, moderation)
- **User engagement & retention** — social features, gamification, community features, personal value (prayer times, masjid info), notifications

---

## Recently shipped / corrections

- **2026-07-09 login button centering + post-login lag** ✅ **[DONE]** (branch `fix/login-button-centering-and-redirect-lag`) — intermittent off-center "Continue with Google" button (mobile + desktop): Google Identity Services bakes a fixed pixel width into its button iframe at render time; the button was rendered with no explicit `width`, so it inherited whatever the container measured at that instant, and centering leaned on fragile `[&>div]` descendant selectors assuming a GIS DOM structure GIS doesn't guarantee. Fix (`GoogleSignInButton.tsx`): render at the container's measured width (clamped to the 400px GIS max) so the iframe fills the slot, drop the descendant CSS for a plain centered flex, and re-render via `ResizeObserver` only when the integer width changes (fixes the render-before-layout race + rotation/resize). Post-login "stuck on login" lag: login page used `getUser()` (network token re-validation) before navigating → switched to `getSession()` (local read); and `GoogleSignInButton` fired `onSuccess` without `await` and cleared `isLoading` in `finally`, so "Signing in…" vanished while the redirect round-trips were still running → now awaits `onSuccess` and holds the loading state until navigation. `tsc --noEmit` clean. *Not yet visually verified against prod Google client — needs a real login pass.*
- **2026-07-06 migration squash** — collapsed `00001`–`00019` + the stale `_run_all.sql` into a single `supabase/migrations/00001_initial_schema.sql` baseline (reconstructed from live catalog introspection) + `supabase/seed.sql` (role_types only). Folded in the **cabinet renames** (`cabinet_departments`/`cabinet_teams`, `scope_type` `cabinet_department`/`cabinet_team`, "Cabinet Department Head") and the **approved additive changes** (conferences `scope_level`/`region_id`/`subregion_id`/`point_of_contact_user_id` + hierarchy CHECK, `memberships.subregion_id` + relaxed "at most one location" CHECK, `is_expansion` on regions/subregions/neighbor_nets). Dropped a dead `set_updated_at` function. ✅ **Replay-verified + applied to remote (2026-07-06):** rebuilt the linked remote (`ym-app-dev`, PG 17.6) atomically via `psql --single-transaction` (drop public objects → baseline → seed, zero errors — proving a clean replay; a `pg_dump` backup was taken first), reset the migration ledger to the single `00001` row, and regenerated `src/types/database.types.ts` (`bunx tsc --noEmit` clean). ⚠️ **Remote data was wiped** (was 1826 users / 20 role_types / 6 conferences → now only the 20 role_types seed) — **re-run the Google Workspace sync to repopulate users** before testing the directory. And **rotate the DB password + Personal Access Token** (both were exposed in the working session).
- **2026-06 prod migration drop** — `00015` (conferences polish; **prod had been silently missing it**), `00016` (privilege-escalation fix), `00017` (email-casing fix) applied to prod via `supabase db push` and **verified live**. Remote ledger now at `00017`. PRs #22–#25 merged to `main`. Pre-apply backups at `/tmp/ym_prod_public_backup.sql` + `/tmp/ym_emails_pre_normalize.csv`.
- ⚠️ **Operational follow-up: rotate the Supabase DB password + Personal Access Token** (exposed during the migration session). Note: resetting the DB password means re-linking the CLI.
- Resolved: local jsdom CJS load error — the `lru-cache` override in `package.json` fixed it; the full vitest suite runs clean locally.
- **CI already runs the full gate** — lint + tsc + `bun audit` + `vitest --coverage` + `next build` + Playwright e2e (`ci.yml`). The remaining gap is making it *blocking* (P1 #20), not adding steps.
- 4 silent-data-loss holes in the admin schedule editor; color-coded role badge variants (PR #21); iOS Safari install banner (`IOSInstallPrompt`)
