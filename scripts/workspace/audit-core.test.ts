import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { normalizeAccounts, accountsFromCsv, auditAccounts, collectDirectory, parseCsv, toCsv } from './audit-core'

const user = (id: string, primaryEmail: string, rest: object = {}) => ({ id, primaryEmail,
  name: {fullName:`Member ${id}`}, isAdmin:false, isDelegatedAdmin:false,
  lastLoginTime:'2026-10-18T12:00:00Z', ...rest })
const audit = (users: unknown[]) => auditAccounts(normalizeAccounts(users),'2026-10-19')

describe('read-only Workspace audit', () => {
  it('normalizes identity and aliases without assuming absent privilege flags are false', () => {
    const [u] = normalizeAccounts([{primaryEmail:' Member@YoungMuslims.com ',aliases:['OTHER@youngmuslims.com'],nonEditableAliases:['member@ymsite.com']}])
    expect(u.primaryEmail).toBe('member@youngmuslims.com')
    expect(u.aliases).toEqual(['other@youngmuslims.com'])
    expect(u.isAdmin).toBeNull()
    expect(auditAccounts([u],'2026-10-19').reviewPlan[0].protectedAccount).toBe(true)
  })
  it('creates legacy-domain candidates without approving a merge or deletion', () => {
    const result = audit([user('one','member@ymsite.com'),user('two','member@youngmuslims.com')])
    const proposal = result.reviewPlan.find(r=>r.accountId==='one')!
    expect(proposal.candidateTarget).toBe('member@youngmuslims.com')
    expect(proposal.status).toBe('Pending review')
    expect(proposal.approvedBy).toBe('')
    expect(proposal.appIdentityMappingReviewed).toBe('')
    expect(result.findings.some(f=>f.code==='legacy-primary')).toBe(true)
  })
  it('protects administrative accounts and flags an absent candidate target', () => {
    const result=audit([user('admin','it@ymsite.com',{isAdmin:true})])
    expect(result.reviewPlan[0].protectedAccount).toBe(true)
    expect(result.reviewPlan[0].proposedAction).toContain('Resolve protection')
    expect(result.findings.map(f=>f.code)).toContain('candidate-target-missing')
  })
  it('treats namesakes as a review signal, not evidence that accounts belong to one person', () => {
    const result=audit([user('one','one@youngmuslims.com',{name:{fullName:'Common Name'}}),user('two','two@youngmuslims.com',{name:{fullName:'common  name'}})])
    expect(result.findings.filter(f=>f.code==='possible-namesake')).toHaveLength(2)
    expect(result.reviewPlan.every(r=>r.candidateTarget==='' && r.status==='Pending review')).toBe(true)
  })
  it('blocks conflicting editable/noneditable alias ownership in the review plan', () => {
    const result=audit([user('one','one@youngmuslims.com',{nonEditableAliases:['alias@ymsite.com']}),user('two','two@youngmuslims.com',{aliases:['alias@ymsite.com']})])
    expect(result.findings.filter(f=>f.code==='address-conflict')).toHaveLength(2)
    expect(result.reviewPlan.every(r=>r.proposedAction.startsWith('Resolve protection'))).toBe(true)
  })
  it('distinguishes unavailable, epoch, old, future and recent login evidence', () => {
    const result=audit([user('missing','missing@youngmuslims.com',{lastLoginTime:undefined}),user('epoch','epoch@youngmuslims.com',{lastLoginTime:'1970-01-01T00:00:00Z'}),user('old','old@youngmuslims.com',{lastLoginTime:'2025-01-01T00:00:00Z'}),user('future','future@youngmuslims.com',{lastLoginTime:'2027-01-01T00:00:00Z'}),user('recent','recent@youngmuslims.com')])
    expect(result.findings.map(f=>f.code).sort()).toEqual(['future-login-time','inactive-login-signal','login-unavailable','never-login-signal'])
    expect(result.reviewPlan.some(r=>r.accountId==='recent')).toBe(false)
  })
  it('rejects incomplete paginated exports and malformed account/alias identities', () => {
    expect(()=>normalizeAccounts({users:[user('one','one@youngmuslims.com')],nextPageToken:'more'})).toThrow('Incomplete')
    expect(()=>normalizeAccounts([user('same','one@youngmuslims.com'),user('same','two@youngmuslims.com')])).toThrow('Duplicate')
    expect(()=>normalizeAccounts([user('one','not-an-email')])).toThrow('Invalid primary')
    expect(()=>normalizeAccounts([user('one','one@youngmuslims.com',{aliases:['bad']})])).toThrow('alias')
    expect(()=>normalizeAccounts([])).toThrow()
  })
  it('validates audit dates and inactivity settings', () => {
    const accounts=normalizeAccounts([user('one','one@youngmuslims.com')])
    expect(()=>auditAccounts(accounts,'2026-02-30')).toThrow()
    expect(()=>auditAccounts(accounts,'2026-10-19',0)).toThrow()
  })
  it('parses Admin CSV while retaining unknown privilege and alias completeness', () => {
    const accounts=accountsFromCsv('Email Address [Required],First Name [Required],Last Name [Required],Status [READ ONLY],User ID\r\nmember@ymsite.com,Example,Member,Suspended,123456789012345678901\r\n')
    expect(accounts[0].id).toBe('123456789012345678901')
    expect(accounts[0].suspended).toBe(true)
    expect(accounts[0].isAdmin).toBeNull()
    expect(auditAccounts(accounts,'2026-10-19').reviewPlan[0].protectedAccount).toBe(true)
    expect(()=>accountsFromCsv('email,email\na,b')).toThrow()
  })
  it('handles quoted CSV evidence and neutralizes formula/identifier coercion in review exports', () => {
    expect(parseCsv('\uFEFFa,b\r\n"first, second","a ""quote""\nnext"')).toEqual([['a','b'],['first, second','a "quote"\nnext']])
    const csv=toCsv(['name','id'],[{name:'=HYPERLINK("bad")',id:'12345678901234567890'}])
    expect(csv).toContain("'=HYPERLINK")
    expect(csv).toContain("'12345678901234567890")
    expect(()=>parseCsv('"unclosed')).toThrow()
  })
  it('collects every Directory page and refuses a pagination loop', async () => {
    const tokens:(string|undefined)[]=[]
    const all=await collectDirectory(async token=>{tokens.push(token);return token?{users:[2]}:{users:[1],nextPageToken:'page2'}})
    expect(all).toEqual([1,2]); expect(tokens).toEqual([undefined,'page2'])
    await expect(collectDirectory(async()=>({users:[],nextPageToken:'same'}))).rejects.toThrow('incomplete')
  })
  it('CLI writes private offline reports, makes no Google call and refuses to overwrite a review', async () => {
    const temp=await mkdtemp(path.join(tmpdir(),'ym-workspace-audit-test-'))
    try {
      const input=path.join(temp,'users.json'),output=path.join(temp,'report')
      await writeFile(input,JSON.stringify([user('one','member@ymsite.com')]))
      const run=()=>spawnSync('bun',['run','scripts/workspace/audit.ts','--input',input,'--output',output,'--as-of','2026-10-19'],{encoding:'utf8',env:{...process.env,GOOGLE_SERVICE_ACCOUNT_EMAIL:'',GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:'',GOOGLE_ADMIN_EMAIL:''}})
      const result=run()
      expect(result.status,result.stderr).toBe(0)
      expect(result.stdout).not.toContain('member@ymsite.com')
      const report=JSON.parse(await readFile(path.join(output,'audit.json'),'utf8'))
      expect(report.accountCount).toBe(1)
      expect(report.reviewPlan[0].approvedBy).toBe('')
      expect((await stat(path.join(output,'audit.json'))).mode & 0o777).toBe(0o600)
      expect(run().status).not.toBe(0)
      expect((await readFile(path.join(output,'audit.json'),'utf8'))).toContain(report.inventorySha256)
    } finally {await rm(temp,{recursive:true,force:true})}
  })
})
