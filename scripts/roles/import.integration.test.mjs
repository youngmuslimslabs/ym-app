import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { buildImportSql, validateRows, HEADERS } from './prepare-import.mjs'

const url = process.env.TEST_DATABASE_URL
function run(sql) {
  return spawnSync('psql', ['-X', '-qAt', '--dbname', url, '-v', 'ON_ERROR_STOP=1'], {
    input: sql, encoding: 'utf8', env: { ...process.env, PGDATABASE: url },
  })
}
function rows(member = 'role-member@youngmuslims.com', scope = '') {
  return validateRows(`${HEADERS.join(',')}\n${member},ns_member,${scope},2026-01-01,,role-verifier@youngmuslims.com,2026-10-19,`, '2026-10-19')
}
test('role import: rollback, commit, idempotency, invalid references and capacity', {
  skip: !url,
}, () => {
  assert.match(url, /^postgresql:\/\/[^/]+@(localhost|127\.0\.0\.1):\d+\//)
  assert.ok(!/[?#]/.test(url), 'local test URL cannot override connection settings')
  const fixture = run(`INSERT INTO auth.users(id,email) VALUES
    ('20000000-0000-4000-8000-000000000001','role-member@youngmuslims.com'),
    ('20000000-0000-4000-8000-000000000002','role-verifier@youngmuslims.com'),
    ('20000000-0000-4000-8000-000000000003','role-second@youngmuslims.com');`)
  assert.equal(fixture.status, 0, fixture.stderr)
  const count = () => Number(run(`SELECT count(*) FROM public.role_assignments a JOIN public.users u ON u.id=a.user_id WHERE u.email LIKE 'role-%';`).stdout.trim())
  let result = run(buildImportSql(rows()))
  assert.equal(result.status, 0, result.stderr)
  assert.equal(count(), 0, 'dry run persists nothing')
  result = run(buildImportSql(rows(), true))
  assert.equal(result.status, 0, result.stderr)
  assert.equal(count(), 1)
  result = run(buildImportSql(rows(), true))
  assert.equal(result.status, 0, result.stderr)
  assert.equal(count(), 1, 'replaying a verified submission does not duplicate')

  // Any invalid row aborts the entire batch, including otherwise valid rows.
  result = run(buildImportSql([...rows('role-second@youngmuslims.com'), ...rows('missing@youngmuslims.com')], true))
  assert.notEqual(result.status, 0)
  assert.equal(count(), 1)
  result = run(buildImportSql(rows('role-second@youngmuslims.com', 'unexpected-national-scope'), true))
  assert.notEqual(result.status, 0)
  const system = rows('role-second@youngmuslims.com'); system[0].role_code='event_admin'
  result = run(buildImportSql(system, true))
  assert.notEqual(result.status, 0, 'SQL independently rejects system roles')

  const holder = rows(); holder[0].role_code='nc'
  result = run(buildImportSql(holder, true))
  assert.equal(result.status, 0, result.stderr)
  const second = rows('role-second@youngmuslims.com'); second[0].role_code='nc'
  result = run(buildImportSql(second, true))
  assert.notEqual(result.status, 0, 'national role capacity is enforced')
  assert.equal(count(), 2)
  const changed = rows(); changed[0].start_date='2026-02-01'
  result = run(buildImportSql(changed, true))
  assert.notEqual(result.status, 0, 'conflicting current assignment is not overwritten')
  const archived = run(`UPDATE public.role_assignments SET is_active=false
    WHERE role_type_id=(SELECT id FROM public.role_types WHERE code='ns_member');`)
  assert.equal(archived.status,0,archived.stderr)
  result = run(buildImportSql(rows(),true))
  assert.notEqual(result.status,0,'archived rows are not silently mistaken for current assignments')
})
