// Public project identifier, not a credential. Keep this deny-list when rotating prod.
export const PROTECTED_PROJECTS = ['todqvyzdvpnwuuonxwch']

export function validatePreviewEnvironment(env) {
  if (!['deploy-preview', 'branch-deploy', 'preview-server'].includes(env.CONTEXT)) return
  if (!env.YM_PREVIEW_PROJECT_REF || !/^[a-z]{20}$/.test(env.YM_PREVIEW_PROJECT_REF)) {
    throw new Error('Set YM_PREVIEW_PROJECT_REF to the separate preview project reference.')
  }
  if (PROTECTED_PROJECTS.includes(env.YM_PREVIEW_PROJECT_REF)) {
    throw new Error('Preview builds cannot use the shared production database.')
  }
  const expected = `https://${env.YM_PREVIEW_PROJECT_REF}.supabase.co`
  if (env.NEXT_PUBLIC_SUPABASE_URL !== expected) {
    throw new Error('Preview Supabase URL does not match YM_PREVIEW_PROJECT_REF.')
  }
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('A preview Supabase public key is required.')
  if (key.startsWith('eyJ')) {
    let claims
    try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()) }
    catch { throw new Error('Invalid preview Supabase public key.') }
    if (claims.role !== 'anon' || claims.ref !== env.YM_PREVIEW_PROJECT_REF) {
      throw new Error('Preview public key must be an anon key for the preview project.')
    }
  } else if (!key.startsWith('sb_publishable_')) {
    throw new Error('Preview client key must be an anon or publishable key.')
  }
  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.endsWith('.apps.googleusercontent.com')) {
    throw new Error('Set the preview Google web client ID.')
  }
  // No production administrative credentials may be inherited into PR code.
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_ADMIN_EMAIL', 'POSTHOG_CLI_PERSONAL_API_KEY']) {
    if (env[name]) throw new Error(`Remove ${name} from preview build context.`)
  }
}
