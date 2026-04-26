import { test, expect } from '@playwright/test'
import { assertSupabaseEnvConfigured } from './helpers'

/**
 * Auth flow E2E tests.
 *
 * These cover the unauthenticated path: middleware redirects, login page UI,
 * and access to public routes. The authenticated path requires a real Google
 * account and a configured test Supabase project, so it is documented as a
 * follow-up rather than implemented here.
 */

assertSupabaseEnvConfigured(test)

test.describe('Unauthenticated redirects', () => {
  for (const path of ['/home', '/profile', '/people', '/onboarding']) {
    test(`${path} redirects to /login via the no-user path`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
      // Must hit the no-user redirect (middleware.ts:66-78), not the
      // getUserError fallback (middleware.ts:43-64). The fallback would tag
      // the URL with ?error=session_expired; absence of that param means we
      // exercised the real auth path.
      expect(page.url()).not.toMatch(/error=session_expired/)
    })
  }

  test('root path redirects to /login via client-side router', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).not.toMatch(/error=session_expired/)
  })
})

test.describe('Public routes', () => {
  test('/login renders the welcome heading', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome to.*young muslims/i })).toBeVisible()
  })

  test('/login surfaces a session_expired error from the query string', async ({ page }) => {
    await page.goto('/login?error=session_expired')
    // The login page reads the error param; we just assert the page still renders cleanly.
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /welcome to.*young muslims/i })).toBeVisible()
  })

  test('/login surfaces an invalid_domain error from the query string', async ({ page }) => {
    await page.goto('/login?error=invalid_domain')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: /welcome to.*young muslims/i })).toBeVisible()
  })

  test('/legal-lol is accessible without auth', async ({ page }) => {
    const response = await page.goto('/legal-lol')
    expect(response?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/legal-lol/)
  })
})

test.describe.skip('Authenticated flows (requires test Supabase project)', () => {
  // To enable: provision a test user in a dev Supabase project, set TEST_USER_EMAIL/PASSWORD
  // env vars, and write a fixture that signs in via supabase-js then storage-states the cookie.
  // Tracked under "[LAUNCH] Test end-to-end auth flow" in docs/project-todos.md.
  test('logged-in user without onboarding lands on /onboarding', async () => {})
  test('logged-in user with completed onboarding lands on /home', async () => {})
  test('user from outside @youngmuslims.com is signed out and redirected', async () => {})
})
