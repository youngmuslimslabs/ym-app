import { test, expect } from '@playwright/test'
import { assertSupabaseEnvConfigured } from './helpers'

/**
 * Onboarding flow E2E tests.
 *
 * The full multi-step flow requires an authenticated Supabase session, which
 * means a test user in a dev project. The cases below cover what we can verify
 * without auth: the middleware gate around /onboarding. The interactive flow
 * is described in skipped specs as a follow-up.
 */

assertSupabaseEnvConfigured(test)

test.describe('Onboarding gate', () => {
  test('/onboarding redirects unauthenticated users to /login (no-user path)', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).not.toMatch(/error=session_expired/)
  })

  test('/onboarding?step=3 redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/onboarding?step=3')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).not.toMatch(/error=session_expired/)
  })
})

test.describe.skip('Onboarding flow (requires authenticated test user)', () => {
  // To enable: sign in via supabase-js with a dev test account that has no
  // onboarding_completed_at, store the auth cookie via Playwright storageState,
  // then drive each step end-to-end. Tracked under "[LAUNCH] E2E tests for
  // onboarding flow" in docs/project-todos.md.
  test('step 1 disables Next until phone, email, ethnicity, DOB are valid', async () => {})
  test('completing all 7 steps marks onboarding_completed_at and redirects to /home', async () => {})
  test('a completed user hitting /onboarding is bounced to /home', async () => {})
  test('back navigation preserves entered data', async () => {})
})
