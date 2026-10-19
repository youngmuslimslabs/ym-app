# Isolated preview environments (#81)

Status: repository guard implemented; hosted setup and signed-in smoke test pending.
`todqvyzdvpnwuuonxwch` is the shared live project, even though its dashboard name
contains “dev”. Never use it for preview tests.

## Configure once

1. Create a separate Supabase project (or an approved Supabase preview branch).
   Review its cost before provisioning. Use the committed migrations and reference
   seeds, not a copy of live member data. The SQL regression workflow replays this
   migration chain in a disposable database first.
2. Set these Netlify values **only** for Deploy Previews / Branch deploys / Preview
   server: `YM_PREVIEW_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
   URL must equal `https://<YM_PREVIEW_PROJECT_REF>.supabase.co`.
   Never share production service-role keys, Google Directory credentials, or
   PostHog management tokens with preview contexts. Leave analytics disabled
   or use a separate PostHog project. Public anon keys still require correct RLS.
3. In Google Cloud, create a separate Web client for previews. Add the exact
   `https://deploy-preview-<PR>--<site>.netlify.app` origin for each PR being tested.
   Google sign-in here uses GIS `signInWithIdToken`, so **Authorized JavaScript
   origins** are required. Supabase redirect wildcards alone do not enable this
   flow. For a stable review URL, use a dedicated Netlify test site tracking the
   feature branch; its production context must also point to the isolated DB.
   Do not change this repository's integration branch to create that site.
4. Enable Google in the preview Supabase Auth settings with the matching client
   ID. Keep the same organization-only account restrictions. Add the preview
   origin to Supabase URL settings for any future redirect-based flows.
5. Give test members access by signing in with designated organization test
   accounts. Do not run the production Google Directory sync in preview.
   The auth trigger provisions their app rows. Any admin test role must be
   granted manually in the preview DB, then removed after testing.
6. Put the isolated URL/key/client ID into GitHub's existing **Preview** environment
   too. GitHub environments do not automatically configure Netlify contexts.
   Run authenticated tests only in a trusted workflow/branch with that environment,
   never expose service credentials to untrusted PR code.

Missing or inherited production settings stop Netlify previews before compilation.
This does not retroactively disable old previews; expire/redeploy those separately.
The check is a configuration guard, not a boundary against malicious branch code.
The actual boundary is withholding live secrets and isolating the project.

## Acceptance check (still required on hosted preview)

- Preview fails when its URL points at the shared project or configuration is missing.
- Sign in at the exact preview hostname; finish onboarding, create a signup, then
  confirm only the preview project changed. Test a regular member and test admin.
- Confirm no live Directory sync or production analytics event was emitted.
- Confirm a different, unlisted hostname cannot use the preview Google client.
- Record the project reference, preview URL, test date and results on #81.

Sources: [Google GIS setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid),
[Netlify contextual variables](https://docs.netlify.com/build/environment-variables/overview/),
[Supabase branching](https://supabase.com/docs/guides/deployment/branching).
