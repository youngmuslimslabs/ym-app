import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validatePreviewEnvironment } from './environment.mjs'
const ref = 'abcdefghijklmnopqrst'
const key = (claims) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
const valid = { CONTEXT: 'deploy-preview', YM_PREVIEW_PROJECT_REF: ref,
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: key({ role: 'anon', ref }),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'test.apps.googleusercontent.com' }
test('permits isolated previews and leaves production/local builds alone', () => {
  assert.doesNotThrow(() => validatePreviewEnvironment(valid))
  assert.doesNotThrow(() => validatePreviewEnvironment({ CONTEXT: 'production' }))
  assert.doesNotThrow(() => validatePreviewEnvironment({}))
})
for (const context of ['deploy-preview', 'branch-deploy', 'preview-server']) {
  test(`${context} fails closed with missing or production credentials`, () => {
    assert.throws(() => validatePreviewEnvironment({ CONTEXT: context }))
    assert.throws(() => validatePreviewEnvironment({ ...valid, CONTEXT: context,
      YM_PREVIEW_PROJECT_REF: 'todqvyzdvpnwuuonxwch',
      NEXT_PUBLIC_SUPABASE_URL: 'https://todqvyzdvpnwuuonxwch.supabase.co' }))
    assert.throws(() => validatePreviewEnvironment({ ...valid, CONTEXT: context,
      NEXT_PUBLIC_SUPABASE_URL: 'https://todqvyzdvpnwuuonxwch.supabase.co' }))
  })
}
test('rejects wrong-project, service-role, and malformed public keys', () => {
  for (const value of [key({ role: 'service_role', ref }), key({ role: 'anon', ref: 'wrong' }), 'eyJ.broken.x', 'sb_secret_not_public']) {
    assert.throws(() => validatePreviewEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: value }))
  }
})
test('rejects inherited administrative secrets', () => {
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_ADMIN_EMAIL', 'POSTHOG_CLI_PERSONAL_API_KEY']) {
    assert.throws(() => validatePreviewEnvironment({ ...valid, [name]: 'secret' }))
  }
})
