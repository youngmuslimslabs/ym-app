import { createHash } from 'node:crypto'

export interface Account {
  id: string
  primaryEmail: string
  fullName: string
  aliases: string[]
  nonEditableAliases: string[]
  isAdmin: boolean | null
  isDelegatedAdmin: boolean | null
  suspended: boolean | null
  archived: boolean | null
  lastLoginTime: string | null
  orgUnitPath: string
}
export interface Finding {
  accountId: string
  primaryEmail: string
  code: string
  evidence: string
}
export interface ReviewRow {
  accountId: string
  sourceEmail: string
  proposedAction: string
  candidateTarget: string
  status: 'Pending review'
  protectedAccount: boolean
  businessOwner: string
  mailDriveCalendarReviewed: string
  groupsAndDelegationReviewed: string
  appIdentityMappingReviewed: string
  approvedBy: string
  approvedOn: string
}
const email = (v: string) => v.trim().toLowerCase()
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid account object')
  return v as Record<string, unknown>
}
const text = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const flag = (v: unknown) => typeof v === 'boolean' ? v : null
function addresses(v: unknown): string[] {
  if (v === undefined || v === null) return []
  if (!Array.isArray(v) || v.some(a => typeof a !== 'string' || !validEmail(email(a)))) {
    throw new Error('Invalid alias list in account inventory')
  }
  return [...new Set((v as string[]).map(email))].sort()
}
export function normalizeAccounts(input: unknown): Account[] {
  let raw = input
  if (!Array.isArray(raw)) {
    const envelope = object(raw)
    if (envelope.nextPageToken) throw new Error('Incomplete paginated export: collect every page before auditing')
    raw = envelope.users ?? envelope.accounts
  }
  if (!Array.isArray(raw) || !raw.length) throw new Error('Inventory must contain at least one account')
  const ids = new Set<string>()
  return raw.map(value => {
    const u = object(value)
    const primaryEmail = email(text(u.primaryEmail))
    if (!validEmail(primaryEmail)) throw new Error('Invalid primary address in account inventory')
    const id = text(u.id) || `email:${primaryEmail}`
    if (ids.has(id)) throw new Error('Duplicate account ID in inventory')
    ids.add(id)
    const name = u.name && typeof u.name === 'object' ? object(u.name) : {}
    const fullName = text(u.fullName) || text(name.fullName) || [text(name.givenName), text(name.familyName)].filter(Boolean).join(' ')
    return { id, primaryEmail, fullName, aliases: addresses(u.aliases),
      nonEditableAliases: addresses(u.nonEditableAliases), isAdmin: flag(u.isAdmin),
      isDelegatedAdmin: flag(u.isDelegatedAdmin), suspended: flag(u.suspended),
      archived: flag(u.archived), lastLoginTime: text(u.lastLoginTime) || null,
      orgUnitPath: text(u.orgUnitPath) }
  }).sort((a, b) => a.primaryEmail.localeCompare(b.primaryEmail) || a.id.localeCompare(b.id))
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = [], cell = '', quoted = false, closed = false
  input = input.replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else cell += c
    } else if (c === '"') {
      if (cell || closed) throw new Error('Invalid CSV quoting')
      quoted = true
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(cell.trim()); cell = ''; closed = false
      if (c !== ',') {
        if (c === '\r' && input[i + 1] === '\n') i++
        if (row.some(Boolean)) rows.push(row)
        row = []
      }
    } else {
      if (closed) throw new Error('Invalid CSV quoting')
      cell += c
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote')
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
  return rows
}

export function accountsFromCsv(input: string): Account[] {
  const [headers, ...rows] = parseCsv(input)
  if (!headers) throw new Error('Empty CSV inventory')
  const normalized = headers.map(h => h.toLowerCase().replace(/\[[^\]]*\]/g, '').replace(/[^a-z]/g, ''))
  if (!normalized.includes('emailaddress') && !normalized.includes('primaryemail')) throw new Error('CSV needs Email Address or primaryEmail')
  if (new Set(normalized).size !== normalized.length) throw new Error('Ambiguous CSV headers')
  return normalizeAccounts(rows.map(cells => {
    if (cells.length !== headers.length) throw new Error('CSV row has an incorrect field count')
    const get = (...names: string[]) => {
      for (const name of names) { const i = normalized.indexOf(name); if (i >= 0) return cells[i] }
      return ''
    }
    const bool = (v: string) => /^(true|yes)$/i.test(v) ? true : /^(false|no)$/i.test(v) ? false : null
    const aliasList = (v: string) => v ? v.split(/[;,]/).map(email).filter(Boolean) : []
    const status = get('status').toLowerCase()
    return { id: get('id', 'userid'), primaryEmail: get('primaryemail', 'emailaddress'),
      name: { givenName: get('firstname', 'givenname'), familyName: get('lastname', 'familyname') },
      fullName: get('fullname'), aliases: aliasList(get('aliases')),
      nonEditableAliases: aliasList(get('noneditablealiases')),
      isAdmin: bool(get('isadmin')), isDelegatedAdmin: bool(get('isdelegatedadmin')),
      suspended: get('suspended') ? bool(get('suspended')) : status === 'suspended' ? true : status === 'active' ? false : null,
      archived: bool(get('archived')), lastLoginTime: get('lastlogintime', 'lastsignin'),
      orgUnitPath: get('orgunitpath') }
  }))
}

export function auditAccounts(accounts: Account[], asOf: string, inactiveDays = 180) {
  const time = Date.parse(`${asOf}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || !Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== asOf) throw new Error('as-of must be a valid YYYY-MM-DD date')
  if (!Number.isInteger(inactiveDays) || inactiveDays < 1) throw new Error('inactive-days must be a positive integer')
  const findings: Finding[] = []
  const owners = new Map<string, Set<string>>()
  const names = new Map<string, Account[]>()
  const primary = new Map(accounts.map(a => [a.primaryEmail, a]))
  const add = (a: Account, code: string, evidence: string) => findings.push({ accountId: a.id, primaryEmail: a.primaryEmail, code, evidence })
  for (const a of accounts) {
    for (const address of [a.primaryEmail, ...a.aliases, ...a.nonEditableAliases]) {
      const ids = owners.get(address) ?? new Set<string>(); ids.add(a.id); owners.set(address, ids)
    }
    const name = a.fullName.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
    if (name.split(' ').length >= 2) names.set(name, [...(names.get(name) ?? []), a])
  }
  const reviewPlan: ReviewRow[] = []
  for (const a of accounts) {
    const domain = a.primaryEmail.split('@')[1]
    const protectedAccount = a.isAdmin !== false || a.isDelegatedAdmin !== false
    if (a.isAdmin || a.isDelegatedAdmin) add(a, 'protected-admin', 'Administrative account; transfer/retain access before any account change.')
    else if (protectedAccount) add(a, 'privileges-unknown', 'Export does not establish both administrator flags; verify in Admin Console.')
    if (domain === 'ymsite.com') add(a, 'legacy-primary', 'Legacy-domain primary account; review primary rename or consolidation, retaining mail delivery as an alias.')
    else if (domain !== 'youngmuslims.com') add(a, 'unexpected-primary-domain', 'Primary domain is outside the app organization domain; confirm its business purpose.')
    if (!a.fullName) add(a, 'missing-name', 'Account has no display name; verify its owner.')
    if (a.suspended) add(a, 'suspended', 'Suspended account; retention and service dependencies need review, not automatic deletion.')
    if (a.archived) add(a, 'archived', 'Archived account; preserve applicable retention obligations.')
    if (!a.lastLoginTime) add(a, 'login-unavailable', 'No login timestamp supplied; inactivity cannot be established.')
    else {
      const login = Date.parse(a.lastLoginTime)
      if (!Number.isFinite(login) || !/^\d{4}-\d{2}-\d{2}T/.test(a.lastLoginTime)) add(a, 'login-unavailable', 'Login timestamp is not an ISO date/time; verify separately.')
      else if (login <= Date.parse('1970-01-02T00:00:00Z')) add(a, 'never-login-signal', 'Directory reports an epoch login value; confirm with usage evidence.')
      else if (login > time + 86400000) add(a, 'future-login-time', 'Login timestamp is later than the audit date; verify the export/timezone.')
      else if (time - login >= inactiveDays * 86400000) add(a, 'inactive-login-signal', `Last reported login is at least ${inactiveDays} days before audit date; usage evidence still required.`)
    }
    const conflicts = [a.primaryEmail, ...a.aliases, ...a.nonEditableAliases].filter(v => (owners.get(v)?.size ?? 0) > 1)
    if (conflicts.length) add(a, 'address-conflict', `Address ownership conflicts in the inventory: ${[...new Set(conflicts)].join('; ')}`)
    const sameName = names.get(a.fullName.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()) ?? []
    if (sameName.length > 1) add(a, 'possible-namesake', 'Another account has the same display name; this is not proof of a duplicate person.')
    if (a.aliases.length >= 30) add(a, 'alias-capacity-review', 'Editable alias count is at the documented limit; verify capacity before proposing another alias.')
    const legacy = domain === 'ymsite.com'
    const candidate = legacy ? `${a.primaryEmail.split('@')[0]}@youngmuslims.com` : ''
    if (legacy && !primary.has(candidate)) add(a, 'candidate-target-missing', 'No matching primary account for the proposed organization address; a reviewer must choose rename vs consolidation.')
    if (findings.some(f => f.accountId === a.id)) reviewPlan.push({ accountId: a.id,
      sourceEmail: a.primaryEmail, proposedAction: protectedAccount || conflicts.length ? 'Resolve protection/conflicts before proposing a change' : legacy ? 'Review primary rename or consolidation; preserve legacy mail as alias' : 'Review findings; no automatic account change',
      candidateTarget: candidate, status: 'Pending review', protectedAccount,
      businessOwner: '', mailDriveCalendarReviewed: '', groupsAndDelegationReviewed: '',
      appIdentityMappingReviewed: '', approvedBy: '', approvedOn: '' })
  }
  return { schemaVersion: 1, asOf, inactiveDays,
    inventorySha256: createHash('sha256').update(JSON.stringify(accounts)).digest('hex'),
    accountCount: accounts.length, findingCount: findings.length, findings, reviewPlan }
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    let value = v === null || v === undefined ? '' : String(v)
    // Human-review export only; JSON preserves authoritative identifiers.
    if (/^[\s]*[=+@-]/.test(value) || /^\d{16,}$/.test(value)) value = `'${value}`
    return `"${value.replaceAll('"', '""')}"`
  }
  return [headers.map(escape).join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\r\n') + '\r\n'
}

export interface DirectoryPage { users?: unknown[] | null; nextPageToken?: string | null }
export async function collectDirectory(list: (pageToken?: string) => Promise<DirectoryPage>): Promise<unknown[]> {
  const users: unknown[] = [], seen = new Set<string>()
  let token: string | undefined
  do {
    const page = await list(token)
    users.push(...(page.users ?? []))
    token = page.nextPageToken || undefined
    if (token) {
      if (seen.has(token)) throw new Error('Directory pagination repeated a token; inventory is incomplete')
      seen.add(token)
    }
  } while (token)
  return users
}
