#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Generate supabase/seed_geography.sql from the cleaned NN master list.
//
//   node docs/geography/generate-geo-seed.mjs
//
// Source of truth: docs/geography/nn-master-cleaned.csv (see CLEANUP-LOG.md).
// Output:          supabase/seed_geography.sql  (regions, subregions, NNs)
//
// People (NNC, Coordinator Email, Core Team Members) are intentionally NOT
// seeded here — they become role_assignments in a post-Google-sync script that
// resolves coordinator emails to real user rows. This file seeds STRUCTURE only.
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const CSV = join(here, 'nn-master-cleaned.csv');
const OUT = join(repoRoot, 'supabase', 'seed_geography.sql');

// -- Code mappings (decided with the owner; UNIQUE NOT NULL in schema) --------
const REGION_CODE = {
  'Northeast': 'NE',
  'Southeast': 'SE',
  'Midwest':   'MW',
  'South':     'SO',
};
const SUBREGION_CODE = {
  'New York East':          'NYE',
  'New York West':          'NYW',
  'New Jersey North':       'NJN',
  'New Jersey Central':     'NJC',
  'New Jersey South':       'NJS',
  'Houston':                'HOU',
  'Dallas East':            'DLE',
  'Dallas West':            'DLW',
  'Chicago':                'CHI',
  'Georgia':                'GA',
  'Massachusetts':          'MA',
  'Kentucky':               'KY',
  'Connecticut':            'CT',
  'Florida':                'FL',
  'Northern Virginia':      'NVA',
  'Central/South Virginia': 'CSVA',
  'Maryland':               'MD',
  'Pennsylvania':           'PA',
  'Washington':             'WA',
  'West':                   'WEST',
  'West Virginia':          'WV',
  'Minnesota':              'MN',
};

// -- Minimal RFC-4180 CSV parser (handles quoted fields + embedded commas) ----
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* skip */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const sqlStr = (v) => (v && v.trim() ? `'${v.trim().replace(/'/g, "''")}'` : 'NULL');
const bool = (v) => (String(v).trim() === '1' ? 'true' : 'false');

// -- Read + parse -------------------------------------------------------------
const rows = parseCsv(readFileSync(CSV, 'utf8'));
const header = rows.shift();
const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
const data = rows.filter((r) => r.some((c) => c && c.trim())); // drop blank lines

const warnings = [];
const regions = new Map();     // name -> { code, is_expansion }
const subregions = new Map();  // name -> { code, region, is_expansion }
const nns = [];

for (const r of data) {
  const region = r[col['Region']].trim();
  const sr = r[col['SR']].trim();
  const nn = r[col['NN']].trim();

  if (region) {
    const code = REGION_CODE[region];
    if (!code) warnings.push(`No region code for "${region}"`);
    const prev = regions.get(region);
    const isExp = bool(r[col['is_region_expansion']]);
    if (prev && prev.is_expansion !== isExp) warnings.push(`Region "${region}" has inconsistent is_expansion`);
    regions.set(region, { code, is_expansion: isExp });
  }

  const srCode = SUBREGION_CODE[sr];
  if (!srCode) warnings.push(`No subregion code for "${sr}"`);
  const srExp = bool(r[col['is_sr_expansion']]);
  const prevSr = subregions.get(sr);
  if (prevSr) {
    if (prevSr.region !== region) warnings.push(`Subregion "${sr}" maps to both "${prevSr.region}" and "${region}"`);
    if (prevSr.is_expansion !== srExp) warnings.push(`Subregion "${sr}" has inconsistent is_sr_expansion`);
  }
  subregions.set(sr, { code: srCode, region, is_expansion: srExp });

  nns.push({
    srCode,
    name: nn,
    location: r[col['LOCATION']],
    address: r[col['Address']],
    day: r[col['Day']],
    link: r[col['Fundraising Link']],
    is_expansion: bool(r[col['is_nn_expansion']]),
  });
}

// duplicate (subregion, NN name) check — the schema has a UNIQUE constraint
const seen = new Set();
for (const n of nns) {
  const key = `${n.srCode}::${n.name}`;
  if (seen.has(key)) warnings.push(`Duplicate NN "${n.name}" in subregion ${n.srCode}`);
  seen.add(key);
}

// -- Emit SQL -----------------------------------------------------------------
let out = `-- ============================================================================
-- YM App — Geography Seed (regions -> subregions -> neighbor_nets)
-- ============================================================================
-- GENERATED FILE — do not edit by hand.
-- Regenerate: node docs/geography/generate-geo-seed.mjs
-- Source:     docs/geography/nn-master-cleaned.csv (see docs/geography/CLEANUP-LOG.md)
--
-- People (NNC / coordinators / core team) are NOT seeded here — they become
-- role_assignments in a post-Google-sync step that resolves emails to users.
-- ============================================================================

INSERT INTO regions (name, code, is_expansion) VALUES
`;
const regionRows = [...regions].map(([name, r]) => `  (${sqlStr(name)}, '${r.code}', ${r.is_expansion})`);
out += regionRows.join(',\n') + '\nON CONFLICT (code) DO NOTHING;\n\n';

out += `INSERT INTO subregions (region_id, name, code, is_expansion) VALUES\n`;
const subRows = [...subregions].map(([name, s]) => {
  const regionRef = s.region ? `(SELECT id FROM regions WHERE code = '${REGION_CODE[s.region]}')` : 'NULL';
  return `  (${regionRef}, ${sqlStr(name)}, '${s.code}', ${s.is_expansion})`;
});
out += subRows.join(',\n') + '\nON CONFLICT (code) DO NOTHING;\n\n';

out += `INSERT INTO neighbor_nets (subregion_id, name, location, address, meeting_day, fundraising_link, is_expansion) VALUES\n`;
const nnRows = nns.map((n) =>
  `  ((SELECT id FROM subregions WHERE code = '${n.srCode}'), ${sqlStr(n.name)}, ${sqlStr(n.location)}, ${sqlStr(n.address)}, ${sqlStr(n.day)}, ${sqlStr(n.link)}, ${n.is_expansion})`
);
out += nnRows.join(',\n') + '\nON CONFLICT (subregion_id, name) DO NOTHING;\n';

writeFileSync(OUT, out);

// -- Report -------------------------------------------------------------------
console.log(`Wrote ${OUT}`);
console.log(`  regions:       ${regions.size}`);
console.log(`  subregions:    ${subregions.size}  (region-less: ${[...subregions.values()].filter((s) => !s.region).length})`);
console.log(`  neighbor_nets: ${nns.length}`);
if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s):`);
  for (const w of [...new Set(warnings)]) console.log(`   - ${w}`);
  process.exitCode = 1;
} else {
  console.log(`\n✓ no warnings`);
}
