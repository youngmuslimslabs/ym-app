#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generate supabase/seed/nnc_assignments.sql — assign NeighborNet Coordinators
// (NNCs) as role_assignments, resolving each NN's coordinator EMAIL to a real
// user row.
//
//   node docs/geography/generate-nnc-assignments.mjs
//
// This is a POST-SYNC step, NOT canonical seed: it depends on `users` being
// populated by the Google Workspace sync (`bun run sync:google`). Run the emitted
// SQL by hand via psql after a sync.
//
// The SQL is self-resolving and idempotent:
//   - an email with no matching user is dropped by the JOIN (reported at gen time),
//   - the NOT EXISTS guard is what enforces one NNC per NN + makes re-runs no-ops
//     (the DB does NOT enforce this: role_types.max_per_scope is advisory, and
//     idx_role_assignments_unique keys on start_date, which is NULL here).
//
// Coordinators given by NAME with no email, and NNs with no coordinator, are NOT
// handled here — they have no email to resolve and need manual assignment.
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const CSV = join(here, 'nn-master-cleaned.csv');
const OUT = join(repoRoot, 'supabase', 'seed', 'nnc_assignments.sql');

// Subregion code map — must match generate-geo-seed.mjs.
const SUBREGION_CODE = {
  'New York East': 'NYE', 'New York West': 'NYW', 'New Jersey North': 'NJN',
  'New Jersey Central': 'NJC', 'New Jersey South': 'NJS', 'Houston': 'HOU',
  'Dallas East': 'DLE', 'Dallas West': 'DLW', 'Chicago': 'CHI', 'Georgia': 'GA',
  'Massachusetts': 'MA', 'Kentucky': 'KY', 'Connecticut': 'CT', 'Florida': 'FL',
  'Northern Virginia': 'NVA', 'Central/South Virginia': 'CSVA', 'Maryland': 'MD',
  'Pennsylvania': 'PA', 'Washington': 'WA', 'West': 'WEST', 'West Virginia': 'WV',
  'Minnesota': 'MN',
};

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const sqlLit = (v) => `'${v.trim().replace(/'/g, "''")}'`;

const rows = parseCsv(readFileSync(CSV, 'utf8'));
const header = rows.shift();
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const roster = [];       // { srCode, nn, email }
let noEmailWithName = 0; // coordinator by name, no email → manual
let noCoordinator = 0;   // no NNC at all

for (const r of rows) {
  if (!r.some((c) => c && c.trim())) continue;
  const sr = (r[col['SR']] ?? '').trim();
  const nn = (r[col['NN']] ?? '').trim();
  const email = (r[col['Coordinator Email']] ?? '').trim().toLowerCase();
  const nncName = (r[col['NNC']] ?? '').trim();
  if (email) {
    roster.push({ srCode: SUBREGION_CODE[sr], nn, email });
  } else if (nncName) {
    noEmailWithName++;
  } else {
    noCoordinator++;
  }
}

const values = roster
  .map((r) => `    (${sqlLit(r.srCode)}, ${sqlLit(r.nn)}, ${sqlLit(r.email)})`)
  .join(',\n');

const out = `-- ============================================================================
-- YM App — NeighborNet Coordinator (NNC) role_assignments
-- ============================================================================
-- GENERATED — do not edit by hand. Regenerate:
--   node docs/geography/generate-nnc-assignments.mjs
--
-- POST-SYNC fixture (NOT canonical seed): requires \`users\` populated by
-- \`bun run sync:google\`. Idempotent + self-resolving:
--   - an email with no matching user row is skipped (dropped by the JOIN),
--   - NOT EXISTS enforces one NNC per NN,
--   - re-running is a no-op.
-- ============================================================================
WITH roster(sr_code, nn_name, email) AS (
  VALUES
${values}
),
nnc AS (SELECT id FROM role_types WHERE code = 'nnc')
INSERT INTO role_assignments (user_id, role_type_id, scope_id, is_active)
SELECT u.id, nnc.id, nn.id, true
FROM roster r
JOIN subregions s      ON s.code = r.sr_code
JOIN neighbor_nets nn  ON nn.subregion_id = s.id AND nn.name = r.nn_name
JOIN users u           ON u.email = r.email
CROSS JOIN nnc
WHERE NOT EXISTS (
  SELECT 1 FROM role_assignments ra
  WHERE ra.role_type_id = nnc.id AND ra.scope_id = nn.id
);
`;

writeFileSync(OUT, out);
console.log(`Wrote ${OUT}`);
console.log(`  NNs with a coordinator email (attempted): ${roster.length}`);
console.log(`  Coordinator by name, no email (manual):   ${noEmailWithName}`);
console.log(`  No coordinator at all:                    ${noCoordinator}`);
console.log(`  NOTE: emails that don't match a synced user are skipped at apply time.`);
