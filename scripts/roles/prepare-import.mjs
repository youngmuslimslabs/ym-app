import fs from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export const HEADERS = ['member_email', 'role_code', 'scope_key', 'start_date',
  'amir_email', 'verified_by', 'verified_on', 'notes']

// RFC 4180 fields, including embedded commas, quotes, CRLF and newlines.
export function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false, closed = false
  text = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else field += c
    } else if (c === '"') {
      if (field || closed) throw new Error('Unexpected quote in CSV')
      quoted = true
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field.trim()); field = ''; closed = false
      if (c !== ',') {
        if (c === '\r' && text[i + 1] === '\n') i++
        if (row.some(Boolean)) rows.push(row)
        row = []
      }
    } else {
      if (closed) throw new Error('Unexpected characters after CSV quote')
      field += c
    }
  }
  if (quoted) throw new Error('Unclosed quote in CSV')
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function orgEmail(value) { return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@youngmuslims\.com$/.test(value) }
function isoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}

export function validateRows(csv, today = new Date().toISOString().slice(0, 10)) {
  const [header, ...input] = parseCsv(csv)
  if (!header || header.join(',') !== HEADERS.join(',')) throw new Error('CSV headers must match the collection template exactly')
  if (!input.length) throw new Error('No completed role rows to import')
  const seen = new Set()
  return input.map((cells, index) => {
    const fail = (why) => { throw new Error(`Row ${index + 2}: ${why}`) }
    if (cells.length !== HEADERS.length) fail('incorrect number of fields')
    const row = Object.fromEntries(HEADERS.map((h, i) => [h, cells[i]]))
    for (const key of ['member_email', 'amir_email', 'verified_by']) row[key] = row[key].toLowerCase()
    row.role_code = row.role_code.toLowerCase()
    if (!orgEmail(row.member_email) || !orgEmail(row.verified_by) || (row.amir_email && !orgEmail(row.amir_email))) fail('use organization emails for member, verifier and optional amir')
    if (!/^[a-z][a-z0-9_]*$/.test(row.role_code) || row.role_code === 'event_admin') fail('use a listed non-system role code')
    for (const key of ['start_date', 'verified_on']) {
      if (!isoDate(row[key]) || row[key] > today) fail(`${key} must be a valid date on or before today (YYYY-MM-DD)`)
    }
    if (row.notes.length > 2000 || row.scope_key.length > 300) fail('notes or scope key is too long')
    if (Object.values(row).some(v => v.includes('\0'))) fail('NUL characters are not allowed')
    const identity = [row.member_email, row.role_code, row.scope_key.toLowerCase()].join('|')
    if (seen.has(identity)) fail('duplicate member, role and scope in this submission')
    seen.add(identity)
    return row
  })
}

const literal = (value) => `'${value.replaceAll("'", "''")}'`
export function buildImportSql(rows, commit = false) {
  if (!rows.length) throw new Error('No rows')
  const values = rows.map(r => `(${HEADERS.map(h => literal(r[h])).join(',')})`).join(',\n')
  return `-- Private role import. Default is a dry run; the final statement controls persistence.
-- All errors roll back the entire batch when run with psql -X -v ON_ERROR_STOP=1.
BEGIN;
SET LOCAL standard_conforming_strings = on;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.role_assignments IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE role_input (${HEADERS.map(h => `${h} text NOT NULL`).join(',')}) ON COMMIT DROP;
INSERT INTO role_input VALUES
${values};
CREATE TEMP TABLE role_resolved ON COMMIT DROP AS
SELECT i.*, u.id AS user_id, rt.id AS role_type_id, rt.category, rt.scope_type,
  rt.max_per_scope, s.id AS scope_id, amir.id AS amir_user_id,
  verifier.id AS verifier_id
FROM role_input i
LEFT JOIN public.users u ON lower(u.email)=i.member_email
LEFT JOIN public.role_types rt ON rt.code=i.role_code
LEFT JOIN public.users amir ON lower(amir.email)=i.amir_email
LEFT JOIN public.users verifier ON lower(verifier.email)=i.verified_by
LEFT JOIN LATERAL (
  SELECT id FROM public.regions WHERE rt.scope_type='region' AND is_active AND lower(code)=lower(i.scope_key)
  UNION ALL SELECT id FROM public.subregions WHERE rt.scope_type='subregion' AND is_active AND lower(code)=lower(i.scope_key)
  UNION ALL SELECT nn.id FROM public.neighbor_nets nn JOIN public.subregions sr ON sr.id=nn.subregion_id
    WHERE rt.scope_type='neighbor_net' AND nn.is_active AND sr.is_active AND lower(sr.code || '/' || nn.name)=lower(i.scope_key)
  UNION ALL SELECT id FROM public.cabinet_departments WHERE rt.scope_type='cabinet_department' AND is_active AND lower(code)=lower(i.scope_key)
  UNION ALL SELECT ct.id FROM public.cabinet_teams ct JOIN public.cabinet_departments cd ON cd.id=ct.department_id
    WHERE rt.scope_type='cabinet_team' AND ct.is_active AND cd.is_active AND lower(cd.code || '/' || ct.name)=lower(i.scope_key)
) s ON true;
DO $validation$
BEGIN
  IF EXISTS (SELECT 1 FROM role_resolved WHERE user_id IS NULL OR role_type_id IS NULL
    OR verifier_id IS NULL OR category='system'
    OR (amir_email<>'' AND amir_user_id IS NULL)
    OR (scope_type='national' AND scope_key<>'')
    OR (scope_type<>'national' AND scope_id IS NULL)) THEN
    RAISE EXCEPTION 'Unresolved member, verifier, amir, role or scope; or a system role. No changes saved.';
  END IF;
  -- Ambiguous scope keys must not multiply the submitted rows.
  IF (SELECT count(*) FROM role_resolved)<>(SELECT count(*) FROM role_input) THEN
    RAISE EXCEPTION 'Ambiguous reference data. No changes saved.';
  END IF;
  -- This is additive collection, not a tool for replacing existing assignments.
  IF EXISTS (SELECT 1 FROM role_resolved r JOIN public.role_assignments a
    ON a.user_id=r.user_id AND a.role_type_id=r.role_type_id AND a.is_active
    AND (a.end_date IS NULL OR a.end_date>=CURRENT_DATE)
    WHERE a.scope_id IS DISTINCT FROM r.scope_id OR a.start_date IS DISTINCT FROM r.start_date::date
      OR (r.amir_email<>'' AND a.amir_user_id IS DISTINCT FROM r.amir_user_id)) THEN
    RAISE EXCEPTION 'Existing assignment differs in scope or start date; resolve manually. No changes saved.';
  END IF;
  IF EXISTS (SELECT 1 FROM role_resolved r JOIN public.role_assignments a
    ON a.user_id=r.user_id AND a.role_type_id=r.role_type_id AND a.start_date=r.start_date::date
    WHERE NOT a.is_active OR a.end_date<CURRENT_DATE) THEN
    RAISE EXCEPTION 'An archived assignment has the same start date; resolve manually. No changes saved.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (
      SELECT role_type_id, scope_id, user_id FROM public.role_assignments
        WHERE is_active AND (end_date IS NULL OR end_date>=CURRENT_DATE)
      UNION
      SELECT role_type_id, scope_id, user_id FROM role_resolved
    ) a JOIN public.role_types rt ON rt.id=a.role_type_id
    WHERE rt.max_per_scope IS NOT NULL
    GROUP BY a.role_type_id,a.scope_id,rt.max_per_scope
    HAVING count(*)>rt.max_per_scope AND EXISTS (
      SELECT 1 FROM role_resolved r WHERE r.role_type_id=a.role_type_id
        AND r.scope_id IS NOT DISTINCT FROM a.scope_id)
  ) THEN RAISE EXCEPTION 'Role capacity exceeded; resolve the current holder first. No changes saved.'; END IF;
END;
$validation$;
INSERT INTO public.role_assignments(user_id,role_type_id,scope_id,amir_user_id,start_date,is_active,notes)
SELECT r.user_id,r.role_type_id,r.scope_id,r.amir_user_id,r.start_date::date,true,
  concat('SRC collection; verified by ',r.verified_by,' on ',r.verified_on,
    CASE WHEN r.notes<>'' THEN '; ' || r.notes ELSE '' END)
FROM role_resolved r
WHERE NOT EXISTS (SELECT 1 FROM public.role_assignments a
  WHERE a.user_id=r.user_id AND a.role_type_id=r.role_type_id
    AND a.scope_id IS NOT DISTINCT FROM r.scope_id AND a.start_date=r.start_date::date)
RETURNING id;
${commit ? 'COMMIT' : 'ROLLBACK'};
`
}

async function main() {
  const args = process.argv.slice(2)
  const take = (name) => args[args.indexOf(name) + 1]
  if (!args.includes('--input') || !args.includes('--output') ||
    args.some((arg, i) => !['--input', '--output', '--commit'].includes(arg) &&
      !['--input', '--output'].includes(args[i - 1]))) {
    throw new Error('Usage: node scripts/roles/prepare-import.mjs --input roster.csv --output private-data/import.sql [--commit]')
  }
  const rows = validateRows(await fs.readFile(take('--input'), 'utf8'))
  await fs.writeFile(take('--output'), buildImportSql(rows, args.includes('--commit')), { mode: 0o600, flag: 'wx' })
  console.log(`Validated ${rows.length} role rows. Generated ${args.includes('--commit') ? 'COMMIT' : 'ROLLBACK (dry-run)'} SQL; no database connection was made.`)
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
