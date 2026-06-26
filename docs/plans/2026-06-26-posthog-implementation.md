# PostHog Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire PostHog across the full app — session replay, user identity, error capture (replacing silent prod errors), onboarding funnel, and core user action events.

**Architecture:** `posthog-js` on the client via a `PHProvider` wrapper + `posthog-node` singleton on the server. `experimental.nodeMiddleware: true` in `next.config.ts` opts middleware into Node.js runtime so `posthog-node` works there directly. `instrumentation.ts` at project root catches any uncaught server exceptions. See full design doc: `docs/plans/2026-06-26-posthog-integration-design.md`.

**Tech Stack:** `posthog-js` (browser), `posthog-node` (server), Next.js App Router, Vitest for tests.

---

## Before You Start

Create a feature worktree:
```bash
git worktree add .worktrees/posthog feature/posthog-integration 2>/dev/null || \
  git worktree add .worktrees/posthog -b feature/posthog-integration
cd .worktrees/posthog
```

All work happens in `.worktrees/posthog`. Never edit files in the main directory.

---

## Task 1: Install Packages + Env Vars

**Files:**
- Modify: `package.json` (via bun)
- Modify: `.env.local`
- Modify: `.env.example` (if it exists, otherwise create it)

**Step 1: Install SDK packages**
```bash
bun add posthog-js posthog-node
```
Expected: both appear in `package.json` dependencies.

**Step 2: Add env vars to `.env.local`**

Add these two lines (get the key from posthog.com → Project Settings → Project API key):
```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_KEY_HERE
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Step 3: Add to `.env.example`**
```bash
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Step 4: Verify build still passes**
```bash
bun run build
```
Expected: no errors.

**Step 5: Commit**
```bash
git add package.json bun.lockb .env.example
git commit -m "feat(posthog): install posthog-js and posthog-node"
```

---

## Task 2: Enable Node.js Middleware + Server Singleton

**Files:**
- Modify: `next.config.ts`
- Create: `src/lib/posthog/server.ts`
- Create: `src/lib/posthog/__tests__/server.test.ts`

**Step 1: Enable Node.js middleware in `next.config.ts`**

Current file:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
};

export default nextConfig;
```

Replace with:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  experimental: {
    nodeMiddleware: true,
  },
};

export default nextConfig;
```

**Step 2: Write the failing test**

Create `src/lib/posthog/__tests__/server.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: vi.fn(),
    captureException: vi.fn(),
    shutdown: vi.fn(),
  })),
}))

describe('getPostHogServer', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a PostHog instance', async () => {
    const { getPostHogServer } = await import('../server')
    const client = getPostHogServer()
    expect(client).toBeDefined()
    expect(client.capture).toBeDefined()
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    const { getPostHogServer } = await import('../server')
    const a = getPostHogServer()
    const b = getPostHogServer()
    expect(a).toBe(b)
  })
})
```

**Step 3: Run test to confirm it fails**
```bash
bun run test src/lib/posthog/__tests__/server.test.ts
```
Expected: FAIL — module not found.

**Step 4: Create `src/lib/posthog/server.ts`**
```ts
import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export function getPostHogServer(): PostHog {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}
```

**Step 5: Run test to confirm it passes**
```bash
bun run test src/lib/posthog/__tests__/server.test.ts
```
Expected: PASS.

**Step 6: Commit**
```bash
git add next.config.ts src/lib/posthog/server.ts src/lib/posthog/__tests__/server.test.ts
git commit -m "feat(posthog): add posthog-node singleton and enable Node.js middleware"
```

---

## Task 3: Client Provider + Page View Tracking

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/components/PostHogPageView.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Write failing test for PHProvider**

Create `src/app/__tests__/providers.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInit = vi.fn()
vi.mock('posthog-js', () => ({
  default: { init: mockInit, capture: vi.fn() },
}))
vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { PHProvider } from '../providers'

describe('PHProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders children', () => {
    const { getByText } = render(<PHProvider><p>hello</p></PHProvider>)
    expect(getByText('hello')).toBeDefined()
  })
})
```

**Step 2: Run test to confirm it fails**
```bash
bun run test src/app/__tests__/providers.test.tsx
```
Expected: FAIL — module not found.

**Step 3: Create `src/app/providers.tsx`**
```tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false,
      session_recording: {
        recordConsoleLog: true,
      },
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

`capture_pageview: false` because App Router doesn't fire History API events on navigation — we handle page views manually in the next step.

**Step 4: Create `src/components/PostHogPageView.tsx`**

This component captures a `$pageview` event on every route change in the App Router:
```tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    const params = searchParams.toString()
    const url = window.origin + pathname + (params ? `?${params}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
```

**Step 5: Run test to confirm providers test passes**
```bash
bun run test src/app/__tests__/providers.test.tsx
```
Expected: PASS.

**Step 6: Read `src/app/layout.tsx` and wrap with PHProvider**

Open `src/app/layout.tsx`. It currently wraps children in some structure. Add the import and wrap:

```tsx
import { PHProvider } from './providers'
import { PostHogPageView } from '@/components/PostHogPageView'
import { Suspense } from 'react'
```

Wrap the body contents:
```tsx
<PHProvider>
  <Suspense>
    <PostHogPageView />
  </Suspense>
  {/* existing children / Toaster / etc */}
</PHProvider>
```

`PostHogPageView` must be inside `<Suspense>` because it calls `useSearchParams()`.

**Step 7: Verify app still builds**
```bash
bun run build
```
Expected: no errors.

**Step 8: Commit**
```bash
git add src/app/providers.tsx src/components/PostHogPageView.tsx src/app/layout.tsx src/app/__tests__/providers.test.tsx
git commit -m "feat(posthog): add PHProvider and page view tracking"
```

---

## Task 4: Instrumentation (Uncaught Server Errors)

**Files:**
- Create: `instrumentation.ts` (at project root, next to `package.json`)

No test needed — `onRequestError` is a Next.js hook, not unit-testable without an integration harness.

**Step 1: Create `instrumentation.ts`**
```ts
export function register() {
  // required by Next.js but no setup needed
}

export const onRequestError = async (
  err: unknown,
  request: { headers: { get: (key: string) => string | null }; url: string },
  _context: unknown
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = await import('./src/lib/posthog/server')
    const posthog = getPostHogServer()
    const sessionId = request.headers.get('X-POSTHOG-SESSION-ID')
    const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID')
    await posthog.captureException(err as Error, distinctId ?? 'server', {
      $session_id: sessionId ?? undefined,
      $current_url: request.url,
    })
  }
}
```

**Step 2: Verify build**
```bash
bun run build
```
Expected: no errors. Next.js 15 auto-detects `instrumentation.ts` at root.

**Step 3: Commit**
```bash
git add instrumentation.ts
git commit -m "feat(posthog): add instrumentation.ts for uncaught server error capture"
```

---

## Task 5: User Identity — identify + reset

**Files:**
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/app/auth/actions.ts`

**Step 1: Read both files fully before editing**

Read `src/contexts/AuthContext.tsx` and `src/app/auth/actions.ts` to understand the current structure.

**Step 2: Add `posthog.identify()` in `AuthContext.tsx`**

In `AuthContext.tsx`, after domain validation passes and `setUser(validUser)` is called (both in the `getSession` block ~L41 and the `onAuthStateChange` block ~L58), add:

```ts
import { usePostHog } from 'posthog-js/react'
// Inside the component:
const posthog = usePostHog()

// After domain passes and setUser is called, add:
posthog?.identify(validUser.id, {
  email: validUser.email,
})
```

Both places — the session restore path and the auth state change path — need this call so identity is set whether the user is already logged in or just signed in.

**Step 3: Add `posthog.reset()` on domain failure in `AuthContext.tsx`**

In the domain validation failure branches (~L35-37 and ~L52-54), after signOut:
```ts
posthog?.reset()
```

**Step 4: Add `posthog.reset()` in `src/app/auth/actions.ts`**

`auth/actions.ts` is a Server Action (`'use server'`). PostHog reset on the server doesn't make sense (it's a client-side concept). Instead, add a `posthog.reset()` call to the **client** that triggers after sign-out.

The sign-out flow: `actions.ts` calls `supabase.auth.signOut()` → redirects. Add a client-side effect in the component that calls `signOut` to call `posthog?.reset()` before triggering the action. Find where the sign-out button/action is called (likely a button in a nav or settings component) and add:

```ts
const posthog = usePostHog()

async function handleSignOut() {
  posthog?.reset()
  await signOut() // the server action
}
```

**Step 5: Run full test suite**
```bash
bun run test
```
Expected: all existing tests pass (AuthContext tests may need mock additions).

**Step 6: Commit**
```bash
git add src/contexts/AuthContext.tsx src/app/auth/actions.ts
git commit -m "feat(posthog): wire identify on login and reset on logout"
```

---

## Task 6: Replace Silent Middleware Errors

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

This is the highest-value change — 4 errors currently silently swallowed in prod become visible in PostHog.

**Step 1: Read `src/lib/supabase/middleware.ts` fully**

Note the 4 locations with `process.env.NODE_ENV === 'development'` guards.

**Step 2: Add server posthog import at top of file**

```ts
import { getPostHogServer } from '@/lib/posthog/server'
```

**Step 3: Replace guard 1 — auth error (~L45)**

Current:
```ts
if (process.env.NODE_ENV === 'development' && getUserError.status !== 400) {
  console.error('Middleware auth error:', getUserError)
}
```

Replace with:
```ts
if (getUserError.status !== 400) {
  getPostHogServer().capture({
    distinctId: 'middleware',
    event: 'middleware_auth_error',
    properties: {
      error_status: getUserError.status,
      error_message: getUserError.message,
      path: request.nextUrl.pathname,
    },
  })
}
```

**Step 4: Replace guard 2 — domain sign-out failure (~L89)**

Current:
```ts
if (process.env.NODE_ENV === 'development') {
  console.error('Sign out error during domain validation:', signOutError)
}
```

Replace with:
```ts
getPostHogServer().capture({
  distinctId: 'middleware',
  event: 'middleware_domain_signout_failed',
  properties: {
    error: String(signOutError),
    path: request.nextUrl.pathname,
  },
})
```

**Step 5: Replace guard 3 — onboarding query error (~L120)**

Current:
```ts
if (process.env.NODE_ENV === 'development') {
  console.error('Middleware onboarding query error:', queryError)
}
```

Replace with:
```ts
getPostHogServer().capture({
  distinctId: 'middleware',
  event: 'middleware_onboarding_query_error',
  properties: {
    error_code: queryError.code,
    error_message: queryError.message,
    path: request.nextUrl.pathname,
  },
})
```

**Step 6: Replace guard 4 — unexpected error catch-all (~L143)**

Current:
```ts
if (process.env.NODE_ENV === 'development') {
  console.error('Unexpected middleware error:', error)
}
```

Replace with:
```ts
getPostHogServer().capture({
  distinctId: 'middleware',
  event: 'middleware_unexpected_error',
  properties: {
    error: String(error),
    path: request.nextUrl.pathname,
  },
})
```

**Step 7: Verify build**
```bash
bun run build
```
Expected: no errors.

**Step 8: Commit**
```bash
git add src/lib/supabase/middleware.ts
git commit -m "feat(posthog): capture silent middleware errors in prod"
```

---

## Task 7: Error Boundaries

**Files:**
- Modify: `src/app/error.tsx`
- Modify: `src/app/global-error.tsx`

**Step 1: Read both files**

**Step 2: Update `src/app/error.tsx`**

This is a client component (error boundaries must be). Add:
```tsx
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

// Inside the component, add:
const posthog = usePostHog()

useEffect(() => {
  posthog?.captureException(error, { $exception_digest: digest })
}, [error, digest, posthog])
```

Remove or keep the existing `console.error` — keeping it is fine for dev.

**Step 3: Update `src/app/global-error.tsx`**

`global-error.tsx` can't use `usePostHog` (it renders outside the `PHProvider` since it catches root layout failures). Use posthog-js directly:

```tsx
import posthog from 'posthog-js'
import { useEffect } from 'react'

// Inside component:
useEffect(() => {
  posthog.captureException(error, undefined, {
    $exception_digest: digest,
    is_global_error: true,
  })
}, [error, digest])
```

Note: `global-error.tsx` already uses hardcoded Tailwind colors intentionally (per project conventions) because `globals.css` may not load. This is expected — don't change the styling.

**Step 4: Run tests**
```bash
bun run test
```
Expected: PASS.

**Step 5: Commit**
```bash
git add src/app/error.tsx src/app/global-error.tsx
git commit -m "feat(posthog): capture exceptions in route and global error boundaries"
```

---

## Task 8: Onboarding Funnel Events

**Files:**
- Modify: `src/app/onboarding/step1-personal-info.tsx`
- Modify: `src/app/onboarding/step2-location.tsx`
- Modify: `src/app/onboarding/step3-ym-roles.tsx`
- Modify: `src/app/onboarding/step4-ym-projects.tsx`
- Modify: `src/app/onboarding/step5-education.tsx`
- Modify: `src/app/onboarding/step6-skills.tsx`
- Modify: `src/app/onboarding/step7-complete.tsx`
- Modify: `src/contexts/OnboardingContext.tsx`
- Modify: `src/contexts/OnboardingReferenceContext.tsx`

**Step 1: Read all 7 step components + both contexts**

Each step has a "Next" handler that calls `saveStepInBackground()` then navigates. That's where the event fires. Read them all before editing.

**Step 2: Add the event call to each step**

All 7 steps use the same pattern. In each step's "Next" handler, after `saveStepInBackground()` and before `router.push(...)`, add:

```ts
const posthog = usePostHog() // at component top

// In handler:
posthog?.capture('onboarding_step_completed', {
  step: N,  // the step number
  step_name: 'STEP_NAME', // e.g. 'personal_info', 'location', etc.
  // step-specific property (see below)
})
```

Step-specific properties to include:

| Step | Extra property |
|---|---|
| 1 personal_info | `phone_provided: !!formData.phone` |
| 2 location | `neighbor_net_id: formData.neighborNetId` |
| 3 ym_roles | `role_count: formData.roles.length` |
| 4 ym_projects | `project_count: formData.projects.length` |
| 5 education | `education_level: formData.educationLevel` |
| 6 skills | `skill_count: formData.skills.length` |
| 7 complete | fire `onboarding_completed` instead (conversion event) |

Step 7 fires a **different** event name `onboarding_completed` with no extra properties — this is the conversion funnel terminus.

**Step 3: Add error events in `OnboardingContext.tsx`**

Three error locations (lines ~157, ~226, ~282). At each:

```ts
// import at top of file (this context is client-side via 'use client')
import posthog from 'posthog-js'

// At each error location:
posthog.capture('onboarding_error', {
  error_type: 'data_load_failed' | 'step_save_failed' | 'complete_failed',
  step: step, // where available
  error: String(error),
})
```

**Step 4: Add error event in `OnboardingReferenceContext.tsx` (~L44)**

Same pattern:
```ts
posthog.capture('onboarding_error', {
  error_type: 'reference_data_load_failed',
  error: String(firstError),
})
```

**Step 5: Run tests**
```bash
bun run test
```

**Step 6: Commit**
```bash
git add src/app/onboarding/ src/contexts/OnboardingContext.tsx src/contexts/OnboardingReferenceContext.tsx
git commit -m "feat(posthog): instrument onboarding funnel steps 1-7 and error events"
```

---

## Task 9: Profile Events

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/profile/hooks/useProfileData.ts`

**Step 1: Read both files**

**Step 2: Add `profile_saved` event in `profile/page.tsx`**

In the save success path (~L100 area), after a successful save response:
```ts
posthog?.capture('profile_saved', {
  change_count: changeCount,
})
```

**Step 3: Add `profile_save_failed` event (~L104)**

In the error path:
```ts
posthog?.captureException(new Error(result.error), undefined, {
  context: 'profile_save',
})
```

**Step 4: Add `profile_load_failed` in `useProfileData.ts` (~L30)**

```ts
import posthog from 'posthog-js'

// at error location:
posthog.capture('profile_load_failed', { error: String(fetchError) })
```

**Step 5: Run tests**
```bash
bun run test
```

**Step 6: Commit**
```bash
git add src/app/profile/page.tsx src/app/profile/hooks/useProfileData.ts
git commit -m "feat(posthog): add profile save and error events"
```

---

## Task 10: People Directory Events

**Files:**
- Modify: `src/app/(app)/people/PeoplePageClient.tsx`
- Modify: `src/app/(app)/people/hooks/usePeopleFilters.ts`
- Modify: `src/app/(app)/people/components/PeopleSearch.tsx`

**Step 1: Read all three files**

**Step 2: Add `people_view_toggled` in `PeoplePageClient.tsx`**

In the view toggle handler:
```ts
posthog?.capture('people_view_toggled', { view_mode: newMode })
```

**Step 3: Add `people_filter_applied` and `people_filter_cleared` in `usePeopleFilters.ts`**

At the filter update call sites:
```ts
posthog?.capture('people_filter_applied', {
  filter_category: filterName,
  filter_count: values.length,
})
```

At `clearAllFilters`:
```ts
posthog?.capture('people_filter_cleared', {})
```

**Step 4: Add `people_search_performed` in `PeopleSearch.tsx`**

On the debounced search change — do NOT log the search text (PII risk — names are being searched):
```ts
posthog?.capture('people_search_performed', {
  query_length: searchValue.length,
  has_query: searchValue.length > 0,
})
```

**Step 5: Run tests**
```bash
bun run test
```

**Step 6: Commit**
```bash
git add src/app/(app)/people/
git commit -m "feat(posthog): add people directory search and filter events"
```

---

## Task 11: Admin Events

**Files:**
- Modify: `src/app/(app)/admin/page.tsx`
- Modify: `src/app/api/admin/sync-google-users/route.ts`

**Step 1: Read both files**

**Step 2: Add `admin_google_sync_initiated` in `admin/page.tsx`**

Before the fetch call to trigger sync:
```ts
posthog?.capture('admin_google_sync_initiated', {})
```

**Step 3: Add `admin_google_sync_completed` and `admin_google_sync_failed` in `route.ts`**

This is a Route Handler (Node.js runtime). Use the server singleton:
```ts
import { getPostHogServer } from '@/lib/posthog/server'

// On success:
getPostHogServer().capture({
  distinctId: triggeredByUserId,
  event: 'admin_google_sync_completed',
  properties: { users_added, duration_ms },
})

// On failure:
getPostHogServer().capture({
  distinctId: triggeredByUserId ?? 'unknown',
  event: 'admin_google_sync_failed',
  properties: { error: String(error), step },
})
```

**Step 4: Run tests**
```bash
bun run test
```

**Step 5: Commit**
```bash
git add src/app/(app)/admin/page.tsx src/app/api/admin/sync-google-users/route.ts
git commit -m "feat(posthog): add admin Google sync events"
```

---

## Task 12: Add Netlify Env Vars + Verification

**Files:**
- Netlify dashboard: add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to site env vars

**Step 1: Push branch and open a PR**
```bash
git push -u origin feature/posthog-integration
gh pr create --title "feat(posthog): analytics + error monitoring (#16)" \
  --body "Implements todo #16. See design doc: docs/plans/2026-06-26-posthog-integration-design.md"
```

**Step 2: Add env vars in Netlify**

Go to Netlify site → Site configuration → Environment variables → Add:
- `NEXT_PUBLIC_POSTHOG_KEY` = your key
- `NEXT_PUBLIC_POSTHOG_HOST` = `https://us.i.posthog.com`

**Step 3: Trigger deploy preview**

Netlify auto-builds on PR. Wait for the deploy preview URL.

**Step 4: Verify in PostHog Live Events**

Open PostHog → Activity → Live Events. Open the deploy preview URL in a browser and:

| Action | Expected event |
|---|---|
| Load any page | `$pageview` |
| Sign in | `user_identified` fires with your user ID |
| Walk onboarding step 1 | `onboarding_step_completed` with `step: 1` |
| Open People directory | `$pageview` |
| Type in search | `people_search_performed` |
| Toggle card/table view | `people_view_toggled` |

**Step 5: Verify Session Replay**

PostHog → Session Replay — confirm a session appears after your test walk. Should show console logs and all clicks.

**Step 6: Check error capture**

PostHog → Error Tracking — may be empty until a real error occurs, but the instrumentation is wired.

**Step 7: Mark todo #16 done in `docs/project-todos.md`**

Find item 16 and mark it `✅ [DONE]` with the PR number.

**Step 8: Merge PR**
```bash
gh pr merge --squash
```

---

## Run All Tests Before Any PR

```bash
bun run test
bunx tsc --noEmit
bun run build
```

All three must pass before opening a PR.
