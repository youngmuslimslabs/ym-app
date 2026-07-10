-- ============================================================================
-- YM App — Seed Data
-- ============================================================================
-- Canonical reference data loaded after migrations on `supabase db reset`
-- (wired via config.toml [db.seed] sql_paths = ["./seed.sql"]).
--
-- This file holds the hand-curated reference data: role_types and the cabinet
-- department/team structure. Geography (regions/subregions/neighbor_nets) is
-- machine-generated from the cleaned NN roster into supabase/seed_geography.sql
-- (regenerate with `node docs/geography/generate-geo-seed.mjs`); both files are
-- wired via config.toml [db.seed] sql_paths. Users arrive via the Google
-- Workspace sync, not the seed; leadership (NNCs, dept heads, team leads) is
-- role_assignments applied after that sync, not seeded here.
--
-- Dev/test fixtures (mock users, conference smoke test, feedback eyeball) live
-- in supabase/seed/*.sql and are run by hand — they are NOT part of this seed.
-- ============================================================================

INSERT INTO role_types (name, code, category, scope_type, max_per_scope, description, sort_order) VALUES
  ('NeighborNet Coordinator',       'nnc',              'neighbor_net', 'neighbor_net',       1,    'Leads a NeighborNet',                                  1),
  ('Core Team Member',              'ct_member',        'neighbor_net', 'neighbor_net',       NULL, 'NN core team member',                                  2),
  ('Sub-Regional Coordinator',      'src',              'subregional',  'subregion',          1,    'Leads a subregion',                                    3),
  ('Sub-Regional Secretary General','sr_sg',            'subregional',  'subregion',          1,    'Subregion secretary',                                  4),
  ('Regional Coordinator',          'rc',               'council',      'region',             1,    'Leads a region',                                       5),
  ('Regional Cloud Rep',            'reg_cloud_rep',    'regional',     'region',             1,    'Regional Cloud representative',                        6),
  ('Regional Special Projects',     'reg_special_proj', 'regional',     'region',             1,    'Regional special projects lead',                       7),
  ('Cloud Coordinator',             'cloud_coord',      'cloud',        'subregion',          1,    'Leads Cloud in a subregion',                           8),
  ('Cloud Member',                  'cloud_member',     'cloud',        'subregion',          NULL, 'Cloud program member',                                 9),
  ('Cabinet Chair',                 'cabinet_chair',    'ns',           'national',           1,    'Leads the Cabinet',                                    10),
  ('Cabinet Secretary General',     'cabinet_sg',       'cabinet',      'national',           1,    'Cabinet secretary',                                    11),
  ('Cabinet Department Head',       'dept_head',        'cabinet',      'cabinet_department', 1,    'Leads a department',                                   12),
  ('Cabinet Team Lead',             'team_lead',        'cabinet',      'cabinet_team',       1,    'Leads a team',                                         13),
  ('Cabinet Team Member',           'team_member',      'cabinet',      'cabinet_team',       NULL, 'Team member',                                          14),
  ('National Coordinator',          'nc',               'ns',           'national',           1,    'Head of the organization',                             15),
  ('NS Secretary General',          'ns_sg',            'ns',           'national',           1,    'National Shura secretary',                             16),
  ('Council Coordinator',           'council_coord',    'ns',           'national',           1,    'Coordinates The Council',                              17),
  ('National Cloud Rep',            'nat_cloud_rep',    'ns',           'national',           1,    'National representative for Cloud',                    18),
  ('NS Member',                     'ns_member',        'ns',           'national',           NULL, 'Member of National Shura',                             19),
  ('Event Admin',                   'event_admin',      'system',       'national',           NULL, 'Can create and manage conferences, sessions, rosters', 100)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Cabinet structure: departments -> teams (owner-provided 2026-07-06)
-- ============================================================================
INSERT INTO cabinet_departments (name, code) VALUES
  ('IT',              'IT'),
  ('Operations',      'OPS'),
  ('Marketing',       'MKT'),
  ('Finance',         'FIN'),
  ('Societal Impact', 'SI'),
  ('Fundraising',     'FR')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cabinet_teams (department_id, name) VALUES
  ((SELECT id FROM cabinet_departments WHERE code = 'IT'),  'Website'),
  ((SELECT id FROM cabinet_departments WHERE code = 'IT'),  'App'),
  ((SELECT id FROM cabinet_departments WHERE code = 'OPS'), 'MYI'),
  ((SELECT id FROM cabinet_departments WHERE code = 'OPS'), 'Alumni'),
  ((SELECT id FROM cabinet_departments WHERE code = 'OPS'), 'QC'),
  ((SELECT id FROM cabinet_departments WHERE code = 'OPS'), 'Prof Dev'),
  ((SELECT id FROM cabinet_departments WHERE code = 'MKT'), 'Social Media'),
  ((SELECT id FROM cabinet_departments WHERE code = 'MKT'), 'Video Production'),
  ((SELECT id FROM cabinet_departments WHERE code = 'MKT'), 'Design'),
  ((SELECT id FROM cabinet_departments WHERE code = 'MKT'), 'Merch'),
  ((SELECT id FROM cabinet_departments WHERE code = 'FIN'), 'Payments'),
  ((SELECT id FROM cabinet_departments WHERE code = 'SI'),  'Writing'),
  ((SELECT id FROM cabinet_departments WHERE code = 'SI'),  'Civic Engagement'),
  ((SELECT id FROM cabinet_departments WHERE code = 'SI'),  'Local Efforts'),
  ((SELECT id FROM cabinet_departments WHERE code = 'FR'),  'Systems'),
  ((SELECT id FROM cabinet_departments WHERE code = 'FR'),  'Donor Stewardship')
ON CONFLICT (department_id, name) DO NOTHING;
