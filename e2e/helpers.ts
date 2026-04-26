import { expect, test as base } from '@playwright/test'

type AnyTest = typeof base

/**
 * Why this exists: the unauthenticated middleware (src/lib/supabase/middleware.ts)
 * has TWO paths that both redirect to /login — the no-user path and the
 * getUserError fallback path. With placeholder Supabase env vars, getUser()
 * errors and the fallback path runs, so a redirect-to-login test would pass
 * even with broken credentials. By asserting that real env vars are present,
 * we ensure these tests exercise the no-user redirect, not the error fallback.
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
