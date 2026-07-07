#!/usr/bin/env node
// Diagnostic: emit SQL that matches the NAME-ONLY coordinators (NNC name present,
// no email) against public.users by first/last name, so we can see which resolve
// uniquely vs ambiguously. Prints SQL to stdout — pipe into psql.
//   node docs/geography/match-nnc-names.mjs | psql ...
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const CSV = join(here, 'nn-master-cleaned.csv');
const SUBREGION_CODE = {
  'New York East':'NYE','New York West':'NYW','New Jersey North':'NJN','New Jersey Central':'NJC',
  'New Jersey South':'NJS','Houston':'HOU','Dallas East':'DLE','Dallas West':'DLW','Chicago':'CHI',
  'Georgia':'GA','Massachusetts':'MA','Kentucky':'KY','Connecticut':'CT','Florida':'FL',
  'Northern Virginia':'NVA','Central/South Virginia':'CSVA','Maryland':'MD','Pennsylvania':'PA',
  'Washington':'WA','West':'WEST','West Virginia':'WV','Minnesota':'MN',
};
function parseCsv(t){const rows=[];let row=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];
 if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
 else if(c==='"')q=true;else if(c===','){row.push(f);f=''}else if(c==='\r'){}
 else if(c==='\n'){row.push(f);rows.push(row);row=[];f=''}else f+=c}
 if(f.length||row.length){row.push(f);rows.push(row)}return rows}
const lit=(v)=>`'${String(v).trim().replace(/'/g,"''")}'`;

const rows = parseCsv(readFileSync(CSV,'utf8'));
const header = rows.shift();
const col = Object.fromEntries(header.map((h,i)=>[h.trim(),i]));

const roster = [];
for (const r of rows) {
  if (!r.some((c)=>c&&c.trim())) continue;
  const email = (r[col['Coordinator Email']] ?? '').trim();
  const name  = (r[col['NNC']] ?? '').trim();
  if (email || !name) continue;            // only name-only rows
  const parts = name.split(/\s+/);
  const first = parts[0];
  const last  = parts.length > 1 ? parts.slice(1).join(' ') : '';
  roster.push({
    srCode: SUBREGION_CODE[(r[col['SR']]??'').trim()],
    nn: (r[col['NN']]??'').trim(),
    name, first, last,
  });
}

const values = roster.map((r)=>
  `    (${lit(r.srCode)}, ${lit(r.nn)}, ${lit(r.name)}, ${lit(r.first)}, ${lit(r.last)})`
).join(',\n');

const rosterCte = `WITH roster(sr_code, nn_name, full_name, first, last) AS (
  VALUES
${values}
)`;

if (process.argv.includes('--insert')) {
  // Seed NNCs ONLY for name-only coordinators that resolve to exactly ONE user
  // (exact first+last, case-insensitive). Idempotent (NOT EXISTS = one NNC/NN).
  process.stdout.write(`${rosterCte},
nnc AS (SELECT id FROM role_types WHERE code = 'nnc'),
unique_match AS (
  SELECT r.sr_code, r.nn_name, (array_agg(u.id))[1] AS user_id
  FROM roster r
  JOIN users u ON lower(u.first_name) = lower(r.first)
              AND ( r.last = '' OR lower(u.last_name) = lower(r.last) )
  GROUP BY r.sr_code, r.nn_name
  HAVING count(u.id) = 1
)
INSERT INTO role_assignments (user_id, role_type_id, scope_id, is_active)
SELECT m.user_id, nnc.id, nn.id, true
FROM unique_match m
JOIN subregions s     ON s.code = m.sr_code
JOIN neighbor_nets nn ON nn.subregion_id = s.id AND nn.name = m.nn_name
CROSS JOIN nnc
WHERE NOT EXISTS (
  SELECT 1 FROM role_assignments ra WHERE ra.role_type_id = nnc.id AND ra.scope_id = nn.id
);
`);
} else if (process.argv.includes('--fuzzy')) {
  // For name-only rows with NO exact first+last match, surface fuzzy CANDIDATES
  // (last-name match, or email local-part containing the first or last token).
  // These are for human confirmation — never auto-seeded.
  process.stdout.write(`${rosterCte},
exact AS (
  SELECT r.sr_code, r.nn_name, count(u.id) AS n
  FROM roster r LEFT JOIN users u
    ON lower(u.first_name)=lower(r.first) AND ( r.last='' OR lower(u.last_name)=lower(r.last) )
  GROUP BY r.sr_code, r.nn_name
),
unresolved AS (SELECT r.* FROM roster r JOIN exact e USING (sr_code, nn_name) WHERE e.n = 0)
SELECT r.nn_name, r.full_name,
       string_agg(DISTINCT u.first_name||' '||u.last_name||' <'||u.email||'>', ' | ') AS fuzzy_candidates
FROM unresolved r
LEFT JOIN users u
  ON lower(u.last_name) = lower(split_part(r.last,' ',-1))
  OR (r.last <> '' AND u.email ILIKE '%'||lower(split_part(r.last,' ',-1))||'%')
GROUP BY r.nn_name, r.full_name
ORDER BY r.full_name;
`);
} else {
  // Diagnostic: list matching users per roster name.
  process.stdout.write(`${rosterCte}
SELECT r.sr_code, r.nn_name, r.full_name,
       count(u.id) AS matches,
       string_agg(u.email, ' | ' ORDER BY u.email) AS matched_emails
FROM roster r
LEFT JOIN users u
  ON lower(u.first_name) = lower(r.first)
 AND ( r.last = '' OR lower(u.last_name) = lower(r.last) )
GROUP BY r.sr_code, r.nn_name, r.full_name
ORDER BY matches, r.full_name;
`);
}
