# Google Workspace account audit (#84)

This tool prepares a **read-only** inventory, findings and an unapproved review
plan. It cannot rename/delete/suspend accounts, create aliases or change the YM
database. No live inventory has been audited yet: this session had no Directory
credentials or supplied export. The current app's public Supabase credentials are
not a substitute for a Workspace inventory.

## Run with Google Directory access

Use the existing environment variable names `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and `GOOGLE_ADMIN_EMAIL`. The service account
needs domain-wide delegation for **only**
`https://www.googleapis.com/auth/admin.directory.user.readonly`, with an authorized
administrator as the impersonated subject. Put secrets in a local ignored env
file or the organization's secret manager; do not paste them in an issue.

```sh
bun run audit:workspace --google --as-of 2026-10-19
```

The query uses `customer: my_customer`, not a single-domain filter, so it includes
both organization and legacy-domain accounts. It follows every page and reads a
limited set of identity/alias/admin/status/login fields. It does not read mail,
Drive documents, passwords, recovery contacts or group membership.

## Run from an existing export

```sh
bun run audit:workspace --input private-data/users.json --as-of 2026-10-19
bun run audit:workspace --input private-data/users.csv --as-of 2026-10-19
```

JSON may be a Directory users array, a complete `{users:[...]}` response, or a
previous `inventory.json`. A response with `nextPageToken` is rejected as incomplete.
CSV accepts common Admin export columns: Email Address, First Name, Last Name,
Status, User ID, Last Sign In, Org Unit Path; bracketed Required/Read Only suffixes
are ignored. Optional canonical columns include `isAdmin`, `isDelegatedAdmin`,
`aliases` and `nonEditableAliases` (semicolon-separated). Missing fields stay
unknown. CSV alone generally cannot establish alias coverage or administrator
status; confirm those in the Admin Console before any action. Dates that are not
ISO timestamps are flagged as unavailable instead of interpreted as inactivity.

Use `--inactive-days 180` to change the review signal. Last login is not a complete
usage record: Google notes that bulk-list login timestamps may be inaccurate.
No inactivity signal authorizes automatic removal. Aliases do not provide separate
accounts/mailboxes, and noneditable domain aliases require separate domain review.

## Outputs

The default output is a new `private-data/workspace-audit-YYYY-MM-DD/` directory.
Use `--output` for another new private location. Existing reviews are never
overwritten. The directory is private to the current OS user, with 0600 report
files; `private-data/` is ignored by Git.

- `inventory.json`: canonical selected account fields. Treat its IDs as text.
- `audit.json`: dated findings, inventory hash and review rows.
- `findings.csv`: legacy primary domains, address conflicts, namesake candidates,
  admin protection, account status and login signals.
- `review-plan.csv`: proposed review actions and possible organization targets,
  with owner/migration/app-mapping/approval fields left blank.

CSV is for human review and protects formula-like cells and long IDs from
spreadsheet interpretation. JSON is the authoritative identity source. Same-name
accounts are **candidates for review**, not confirmed duplicates. Matching local
parts across domains also do not establish common ownership. Administrator flags
that are absent keep the account protected until verified. Alias conflicts block
any proposed consolidation; a missing target requires an owner decision.

## Review and eventual cleanup

Have the existing #84 owner confirm each account's purpose and owner. For a
legacy primary, choose a primary-address rename or consolidation into a separately
verified organization account. Preserve needed legacy mail delivery as aliases;
do not remove the legacy domain simply because its address appears in findings.
Check mailbox/Drive/Calendar transfer, retention, groups, delegates, service
accounts and admin access. Verify alias availability and domain-level behavior.

Record the YM app's existing `users.id`, `auth_id`, roles/memberships and the Google
identity before changing accounts. An alias/renamed address and a deleted/recreated
Google account have different identity consequences. Plan an explicit backed-up
app identity migration where necessary; this audit does not update those records.

Only after those checks should the owner approve concrete account-level actions.
Execute approved changes through the normal administrator process, verify login
and mail delivery, then record completion. No account mutation command is included.

Tests: `bunx vitest run --config vitest.workspace.config.mts`; `bunx tsc --noEmit`.
The tests use synthetic identities and cover pagination, namesakes, protected
admins, conflicts, missing data, CSV safety and private/non-overwriting reports.

Sources: [Directory users list](https://developers.google.com/workspace/admin/directory/reference/rest/v1/users/list),
[user aliases](https://developers.google.com/workspace/admin/directory/v1/guides/manage-user-aliases),
[bulk user retrieval limits](https://developers.google.com/workspace/admin/directory/v1/guides/manage-users).
