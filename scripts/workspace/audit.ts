import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizeAccounts, accountsFromCsv, auditAccounts, toCsv, collectDirectory } from './audit-core'

async function main() {
  const args = process.argv.slice(2)
  const options = new Map<string, string>()
  let live = false
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--google') { live = true; continue }
    if (!['--input','--output','--as-of','--inactive-days'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Usage: bun run audit:workspace (--google | --input users.json/csv) [--output private-data/audit-folder] [--as-of YYYY-MM-DD] [--inactive-days 180]')
    if (options.has(args[i])) throw new Error('Duplicate command option')
    options.set(args[i], args[++i])
  }
  if (live === options.has('--input')) throw new Error('Choose exactly one source: --google or --input')
  const asOf = options.get('--as-of') ?? new Date().toISOString().slice(0, 10)
  let accounts
  if (live) {
    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const adminEmail = process.env.GOOGLE_ADMIN_EMAIL
    if (!serviceEmail || !privateKey || !adminEmail) throw new Error('Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY and GOOGLE_ADMIN_EMAIL for a read-only Directory audit. No live audit was performed.')
    const { google } = await import('googleapis')
    const auth = new google.auth.JWT({ email: serviceEmail, key: privateKey, subject: adminEmail,
      scopes: ['https://www.googleapis.com/auth/admin.directory.user.readonly'] })
    const directory = google.admin({version:'directory_v1', auth})
    let users
    try {
      users = await collectDirectory(async pageToken => (await directory.users.list({
        customer: 'my_customer', projection: 'full', viewType: 'admin_view', maxResults: 500, pageToken,
        fields: 'nextPageToken,users(id,primaryEmail,name,aliases,nonEditableAliases,isAdmin,isDelegatedAdmin,suspended,archived,lastLoginTime,orgUnitPath)',
      })).data)
    } catch { throw new Error('Directory read failed; verify read-only delegation, admin access and connectivity. No complete audit was produced.') }
    accounts = normalizeAccounts(users)
  } else {
    const filename = options.get('--input')!
    const contents = await fs.readFile(filename, 'utf8')
    if (filename.toLowerCase().endsWith('.csv')) accounts = accountsFromCsv(contents)
    else {
      let data: unknown
      try { data = JSON.parse(contents) } catch { throw new Error('Input is not valid JSON; use a complete Directory users export or Admin CSV') }
      accounts = normalizeAccounts(data)
    }
  }
  const report = auditAccounts(accounts, asOf, Number(options.get('--inactive-days') ?? 180))
  const output = path.resolve(options.get('--output') ?? `private-data/workspace-audit-${asOf}`)
  await fs.mkdir(path.dirname(output), {recursive:true,mode:0o700})
  // Never overwrite a previous review or approval record.
  await fs.mkdir(output, {mode:0o700})
  const source = live ? 'Directory API: full customer pagination' : 'Supplied export: completeness must be verified'
  await fs.writeFile(path.join(output,'inventory.json'), JSON.stringify({source,accounts},null,2), {mode:0o600,flag:'wx'})
  await fs.writeFile(path.join(output,'audit.json'), JSON.stringify({source,...report},null,2), {mode:0o600,flag:'wx'})
  await fs.writeFile(path.join(output,'findings.csv'), toCsv(['accountId','primaryEmail','code','evidence'], report.findings.map(f=>({...f}))), {mode:0o600,flag:'wx'})
  await fs.writeFile(path.join(output,'review-plan.csv'), toCsv(['accountId','sourceEmail','proposedAction','candidateTarget','status','protectedAccount','businessOwner','mailDriveCalendarReviewed','groupsAndDelegationReviewed','appIdentityMappingReviewed','approvedBy','approvedOn'], report.reviewPlan.map(r=>({...r}))), {mode:0o600,flag:'wx'})
  console.log(`Read-only audit prepared: ${report.accountCount} accounts, ${report.findingCount} findings. Private reports saved to ${output}. No accounts or aliases were changed.`)
}
main().catch(() => {
  // Error messages can include Directory member/credential material; log no raw API errors.
  console.error('Workspace audit did not complete. Check source/options, complete JSON or Admin CSV, read-only Google credentials, and a new output directory. See docs/operations/workspace-account-audit.md.')
  process.exitCode = 1
})
