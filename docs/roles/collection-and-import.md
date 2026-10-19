# SRC role collection (#83)

Status: template, validation and additive import prepared. Actual SRC submissions,
NS verification and database import are pending. No member data was invented or
imported, and no outreach was sent.

## Collection

Import `collection-template.xlsx` into Google Sheets, then share with the SRCs
through the organization's normal restricted-access channel. Use one row per
**current** member/role/scope. Leave unknown values blank for follow-up; do not
guess. `member_email` is the existing organization login, not a name match.
Dates must export as YYYY-MM-DD. Leave optional amir/notes blank when unknown.
`verified_by` and `verified_on` must be completed by an authorized reviewer after
checking the submission. A filled-in verifier cell records provenance; the tool
cannot establish whether a human actually authorized the assignment.

Before distribution, refresh the workbook's Role codes and Scope keys lists from
the intended database using `scripts/roles/export-reference.sql`. Local seed roles
are only a starting list; live additions such as tarbiyah/expansion roles may differ.
Run the export from a private folder, not the repository root. Use only the exact
codes; NN keys are `SUBREGION_CODE/NeighborNet name`, cabinet team keys are
`DEPARTMENT_CODE/Team name`. A national role has a blank scope key. Never collect
Event Admin or other system roles in this workflow.

Suggested distribution message (draft, unsent):

> Assalamu alaikum! Please have each SRC fill in the current role holders for
> their subregion in the role collection sheet, one row per role. Use each
> member's @youngmuslims.com email and the role/scope reference lists. Flag
> missing roles or people instead of guessing. NS/reviewers should verify the
> submissions and fill in the verification columns before we import them.

Confirm a collection deadline and the responsible NS reviewer when distributing;
no schedule or recipient list has been assumed.

## Prepare and review the import

1. Export the completed **Roles** sheet as CSV. Keep it under ignored
   `private-data/`; never attach member submissions to this public repository.
2. Run:
   `node scripts/roles/prepare-import.mjs --input private-data/roles.csv --output private-data/rehearsal.sql`
3. Review the generated SQL locally. Execute it against the isolated preview DB
   with `psql -X -v ON_ERROR_STOP=1 -f private-data/rehearsal.sql`. It validates
   database references and capacities, attempts the batch, then **ROLLBACKs**.
   Fix every error and rerun. Reports expose counts/row positions; the SQL itself
   contains emails and must remain private. Existing matching rows are skipped.
4. After reviewer approval, generate a new file with `--commit`. Take and verify
   a live backup, confirm the target project manually, then run that reviewed
   file using the database owner's approved connection. COMMIT SQL is not an
   automatic deployment; this tool never connects to a database on its own.
5. Spot-check every SRC's submitted totals, role holders, scope and amir. The
   tool inserts only; it does not delete, end-date or overwrite existing roles,
   change memberships, create accounts, or grant admin permissions. Conflicting
   current assignments and capacity excesses abort the batch. Resolve these with
   the owner separately. Delete private exports according to the team's policy.
6. Reassess onboarding role selection after the verified import, as requested in
   #83. Keep that product decision separate from this additive data operation.

Unknown members/verifiers/amirs, missing or ambiguous scopes, unknown/system role
types and duplicate input rows all block importing. Assignments are locked during
validation/insertion to prevent concurrent capacity checks racing this batch.
