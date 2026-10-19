import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HEADERS, parseCsv, validateRows, buildImportSql } from './prepare-import.mjs'
const header = HEADERS.join(',')
const row = 'member@youngmuslims.com,nnc,HOU/Katy,2026-01-01,,verifier@youngmuslims.com,2026-10-19,'
test('parses Google Sheets CSV with BOM, escaped quotes, CRLF and multiline notes', () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"first, second","a ""quote""\nnext"\r\n'),
    [['a','b'],['first, second','a "quote"\nnext']])
  assert.throws(() => parseCsv('"open'))
  assert.throws(() => parseCsv('"closed"trailing'))
})
test('accepts current verified org roles and normalizes email casing', () => {
  assert.equal(validateRows(`${header}\n${row.toUpperCase().replace('NNC','nnc')}`, '2026-10-19')[0].member_email,'member@youngmuslims.com')
})
test('blocks incomplete, duplicate, unverified, privileged and invalid-date rows', () => {
  for (const bad of [row.replace('member@youngmuslims.com','member@example.org'),
    row.replace('nnc','event_admin'), row.replace('2026-01-01','2026-02-30'),
    row.replace('2026-01-01','2027-01-01'),row.replace('verifier@youngmuslims.com',''),
    row.replace('2026-10-19',''),row.replace(',nnc,',',=malicious,')]) {
    assert.throws(() => validateRows(`${header}\n${bad}`, '2026-10-19'))
  }
  assert.throws(() => validateRows(`${header}\n${row}\n${row}`, '2026-10-19'))
  assert.throws(() => validateRows(header, '2026-10-19'))
})
test('SQL is escaped and dry-run by default, with persistence explicitly requested', () => {
  const rows = validateRows(`${header}\n${row}"O'Brien, verified"`, '2026-10-19')
  const sql = buildImportSql(rows)
  assert.ok(sql.includes("O''Brien, verified"))
  assert.ok(sql.endsWith('ROLLBACK;\n'))
  assert.ok(buildImportSql(rows,true).endsWith('COMMIT;\n'))
})
