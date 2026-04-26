import { expect, test as base } from '@playwright/test'

type AnyTest = typeof base

/**
 * Why this exists: with placeholder/missing Supabase env vars, the middleware
 * still redirects unauthenticated requests to /login (via the getUserError
 * fallback path), so a bare redirect-to-login test would pass even with
 * broken credentials and never actually exercise the real auth client.
 * Asserting that real env vars are present is the cheapest way to prove the
 * test environment is wired correctly — the test is otherwise identical
 * regardless of env validity, since both middleware paths converge on /login.
 */
export function assertSupabaseEnvConfigured(test: AnyTest) {
  test.beforeAll(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    expect(url, 'NEXT_PUBLIC_SUPABASE_URL must be set in CI/local env').toBeTruthy()
    expect(key, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in CI/local env').toBeTruthy()
    expect(url, 'NEXT_PUBLIC_SUPABASE_URL must not be the placeholder example').not.toMatch(
      /placeholder|your-supabase|example/i,
    )
  })
}
