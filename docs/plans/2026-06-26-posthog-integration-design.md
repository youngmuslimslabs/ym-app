# PostHog Integration Design

**Date:** 2026-06-26  
**Todo item:** #16 — PostHog analytics + error monitoring  
**Priority:** P1

---

## Goal

Wire up PostHog across the full app — event tracking, error capture, session replay, and user identity — replacing the `NODE_ENV === 'development'` console guards in middleware so prod failures surface.

## Architecture

### Runtimes

Nothing in the app requires Edge. Middleware runs on Edge only because it's the Next.js default. We opt into Node.js middleware with one flag:

```ts
// next.config.ts
experimental: { nodeMiddleware: true }
```

This unlocks `posthog-node` in middleware, eliminating any URL-param relay workaround.

### Layers

| Layer | SDK | Covers |
|---|---|---|
| Client (browser) | `@posthog/next` + `posthog-js` | Page views, user events, session replay, `identify`, `reset` |
| Server (Node.js) | `posthog-node` singleton | Middleware errors, Route Handlers, Server Actions |
| Uncaught server errors | `instrumentation.js` `onRequestError` | Any unhandled exception in Node.js runtime |

### Key files to create/modify

| File | Action |
|---|---|
| `next.config.ts` | Add `experimental: { nodeMiddleware: true }` |
| `src/lib/posthog/server.ts` | `posthog-node` singleton (`flushAt: 1, flushInterval: 0`) |
| `src/app/providers.tsx` | `PHProvider` client component wrapping `PostHogProvider` |
| `src/app/layout.tsx` | Wrap with `PHProvider` |
| `instrumentation.ts` | `onRequestError` hook for uncaught Node.js errors |
| `src/lib/supabase/middleware.ts` | Replace 4× `NODE_ENV` guards with `posthog.capture()` |
| `src/contexts/AuthContext.tsx` | `posthog.identify()` on login, `posthog.reset()` on logout |
| `src/app/auth/actions.ts` | `posthog.reset()` server-side on sign-out |
| Onboarding step components (×7) | Step completion events |
| `src/contexts/OnboardingContext.tsx` | Error events on save/load failure |
| `src/app/profile/` hooks + page | Profile save + error events |
| `src/app/(app)/people/` | Directory filter + search events |
| `src/app/(app)/admin/` | Admin action events |
| `src/app/error.tsx` | `posthog.captureException()` |
| `src/app/global-error.tsx` | `posthog.captureException()` |

---

## Session Replay

- Enable for **all sessions** (free tier: 5,000/month; org ~1,800 users, expected to stay under)
- Config: `session_recording: { recordConsoleLog: true }` in `PHProvider`
- If monthly replays exceed 5k, cost is $0.005/session — negligible

---

## Events Catalogue

### Critical — Auth & Identity

| Event | Where | Properties |
|---|---|---|
| `user_identified` | `AuthContext.tsx` ~L41, L58 | `{ id, email, first_name, last_name }` via `posthog.identify()` |
| `user_logged_out` | `auth/actions.ts` | — via `posthog.reset()` |
| `user_login_failed` | `GoogleSignInButton.tsx` | `{ error_message }` |
| `auth_domain_validation_failed` | `AuthContext.tsx` | `{ email_domain, trigger: 'session_restore' \| 'auth_state_change' }` |

### Critical — Middleware Errors (currently silent in prod)

| Event | Where | Properties |
|---|---|---|
| `middleware_auth_error` | `middleware.ts` ~L45 | `{ error_status, error_message, path }` |
| `middleware_domain_signout_failed` | `middleware.ts` ~L89 | `{ error }` |
| `middleware_onboarding_query_error` | `middleware.ts` ~L120 | `{ error_code, error_message, path }` |
| `middleware_unexpected_error` | `middleware.ts` ~L143 | `{ error, path }` |

### Critical — Global Error Boundaries

| Event | Where | Properties |
|---|---|---|
| `route_error` | `src/app/error.tsx` | `{ message, digest }` via `captureException` |
| `global_error` | `src/app/global-error.tsx` | `{ message, digest }` via `captureException` |

### High — Onboarding Funnel (conversion tracking)

All 7 steps fire on the "Next" button press, after `saveStepInBackground()` is called.

| Event | File | Properties |
|---|---|---|
| `onboarding_step_completed` | `step1-personal-info.tsx` | `{ step: 1, step_name: 'personal_info' }` |
| `onboarding_step_completed` | `step2-location.tsx` | `{ step: 2, step_name: 'location', neighbor_net_id }` |
| `onboarding_step_completed` | `step3-ym-roles.tsx` | `{ step: 3, step_name: 'ym_roles', role_count }` |
| `onboarding_step_completed` | `step4-ym-projects.tsx` | `{ step: 4, step_name: 'ym_projects', project_count }` |
| `onboarding_step_completed` | `step5-education.tsx` | `{ step: 5, step_name: 'education', education_level }` |
| `onboarding_step_completed` | `step6-skills.tsx` | `{ step: 6, step_name: 'skills', skill_count }` |
| `onboarding_completed` | `step7-complete.tsx` | `{ step: 7 }` — conversion event |
| `onboarding_error` | `OnboardingContext.tsx` | `{ error_type: 'data_load_failed', error_message }` |
| `onboarding_error` | `OnboardingContext.tsx` | `{ error_type: 'step_save_failed', step, error_message }` |
| `onboarding_error` | `OnboardingContext.tsx` | `{ error_type: 'complete_failed', error_message }` |
| `onboarding_error` | `OnboardingReferenceContext.tsx` | `{ error_type: 'reference_data_load_failed', error_message }` |

Use a single `onboarding_step_completed` event name with a `step` property — PostHog funnels work best with one event + a filter property, not 7 distinct event names. Similarly, all onboarding errors use a single `onboarding_error` event with an `error_type` discriminator property.

### High — Profile

| Event | Where | Properties |
|---|---|---|
| `profile_saved` | `profile/page.tsx` ~L100 | `{ change_count }` |
| `profile_load_failed` | `useProfileData.ts` ~L30 | `{ error }` |
| `profile_save_failed` | `profile/page.tsx` ~L104 | `{ error }` |

### High — People Directory

| Event | Where | Properties |
|---|---|---|
| `people_search_performed` | `PeopleSearch.tsx` | `{ query_length }` — don't log query text (PII risk) |
| `people_filter_applied` | `usePeopleFilters.ts` | `{ filter_category, filter_count }` |
| `people_filter_cleared` | `usePeopleFilters.ts` | — |
| `people_view_toggled` | `PeoplePageClient.tsx` | `{ view_mode: 'cards' \| 'table' }` |
| `people_load_more_clicked` | `usePeopleFilters.ts` | `{ visible_count }` |
| `person_profile_viewed` | `people/[id]/page.tsx` | — (page view auto-captured) |

### Medium — Admin

| Event | Where | Properties |
|---|---|---|
| `admin_google_sync_initiated` | `admin/page.tsx` | — |
| `admin_google_sync_completed` | `sync-google-users/route.ts` | `{ users_added, duration_ms }` |
| `admin_google_sync_failed` | `sync-google-users/route.ts` | `{ error, step }` |
| `admin_conference_published` | `ConferenceEditor.tsx` | `{ conference_id }` |
| `admin_conference_deleted` | `ConferenceEditor.tsx` | `{ conference_id }` |

---

## Env Vars

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Add to `.env.local`, Netlify environment variables, and `.env.example`.

---

## Out of scope (for now)

- Feature flags / experiments — no rollouts planned
- Surveys — add when there's a specific feedback ask
- LLM observability — not applicable
- A/B testing — not applicable

---

## Verification

After deploy to preview:
1. Open PostHog → Live Events — confirm `$pageview` events arrive
2. Sign in → confirm `user_identified` fires with correct user ID
3. Walk onboarding step 1 → confirm `onboarding_step_completed` fires with `step: 1`
4. Trigger a middleware auth error (e.g., corrupt cookie) → confirm `middleware_auth_error` in PostHog
5. Session Replay → confirm a session appears with console logs
