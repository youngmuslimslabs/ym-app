-- Migration: Seed real geography (regions -> subregions -> neighbor_nets)
-- =====================================================================
-- Replaces the placeholder geography that shipped in 00004_seed_data.sql and
-- was re-seeded by 00011_repair_dropped_tables.sql (region "Texas"; subregions
-- "Houston"/"Dallas"; neighbor_nets "Katy NN"/"Sugar Land NN"/"Downtown NN").
--
-- WHY: prod has 1,823 real users loaded but only the placeholder geography, so
-- no one can pick their actual NeighborNet during onboarding (only ~8 real
-- memberships exist as a result). This is the top launch blocker (roadmap P0 #1).
--
-- STRATEGY (owner decisions): clean-slate REPLACE — delete ALL existing
-- geography and insert the real hierarchy. Any membership or role_assignment
-- still pointing at the deleted placeholders has its location/scope CLEARED so
-- those users re-pick (they will not be auto-sent back through onboarding —
-- see "Known limitation" below).
--
-- FK NOTES (why the order below is mandatory):
--   * memberships.neighbor_net_id / region_id  -> RESTRICT (no ON DELETE): a
--     referenced region/NN CANNOT be deleted, so locations are cleared FIRST.
--   * role_assignments.scope_id                -> NO foreign key (polymorphic):
--     the delete won't fail, but geo-scoped scope_ids would become silent
--     dangling references, so they are cleared too.
--   * subregions.region_id, neighbor_nets.subregion_id -> ON DELETE CASCADE, so
--     a single DELETE FROM regions tears down the whole tree.
--
-- ATOMICITY: `supabase db push` runs this file in one transaction; if any
-- statement fails the whole migration rolls back (matches repo convention —
-- no explicit BEGIN/COMMIT).
--
-- Known limitation: clearing a completed user's location does NOT reset
-- onboarding_completed_at, so they won't be auto-prompted to re-pick; with
-- only ~8 affected memberships this is acceptable (roadmap-confirmed).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Detach existing references to placeholder geography (clean-slate prep)
-- ---------------------------------------------------------------------

-- Memberships: null out any location pointing at geography we're about to drop.
-- The membership_location CHECK allows (neighbor_net_id IS NULL AND region_id IS NULL).
UPDATE memberships
SET neighbor_net_id = NULL,
    region_id       = NULL,
    updated_at      = now()
WHERE neighbor_net_id IS NOT NULL
   OR region_id       IS NOT NULL;

-- Role assignments: null out scope_id where it points at a geography row.
-- scope_id is polymorphic (no FK), so only clear ones that actually match a
-- region/subregion/neighbor_net id — leave department/team/other scopes intact.
UPDATE role_assignments
SET scope_id   = NULL,
    updated_at = now()
WHERE scope_id IN (SELECT id FROM neighbor_nets)
   OR scope_id IN (SELECT id FROM subregions)
   OR scope_id IN (SELECT id FROM regions);

-- ---------------------------------------------------------------------
-- 2. Delete all placeholder geography (cascades subregions -> neighbor_nets)
-- ---------------------------------------------------------------------
DELETE FROM regions;

-- ---------------------------------------------------------------------
-- 3. Insert the REAL hierarchy
-- ---------------------------------------------------------------------
-- Source: "YM NN MasterList - Fundraising.xlsx" (Fundraising tab), transformed:
--   • "Expansion"/"West - (Expansion)" were a STATUS in the sheet, not a place.
--     Per owner: expansion areas are normal ACTIVE regions. NY West / Pennsylvania
--     expansion NNs folded back into their NorthEast subregions; VA/MD/WV grouped
--     into a new "DMV" region; WA + the LV/AZ/LA bucket into a new "West" region;
--     Minnesota into Midwest. (Stopgap — full rework tracked in roadmap P2 #30.)
--   • Corrections: "North Husdon"→"North Hudson", "Liburn"→"Lilburn",
--     "Westchester" (PA)→"West Chester" (disambiguates from NY's Westchester).
--     "Synott" (Houston) is correct as-is. Numeric NN names "571"/"75" are real.
--   • codes are internal-only (never shown in the app — pickers select id,name),
--     so they're generated as slugs.
-- Totals: 6 regions, 23 subregions, 118 neighbor_nets.
-- Subregions reference their region by CODE; NNs reference their subregion by
-- CODE — no hand-written UUIDs. Re-runnable (ON CONFLICT / NOT EXISTS guards).

-- 3a. Regions  (name, code)
INSERT INTO regions (name, code) VALUES
  ('NorthEast', 'northeast'),
  ('South', 'south'),
  ('Midwest', 'midwest'),
  ('Southeast', 'southeast'),
  ('DMV', 'dmv'),
  ('West', 'west')
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, is_active = true, updated_at = now();

-- 3b. Subregions  (region_code, name, code)
INSERT INTO subregions (region_id, name, code)
SELECT r.id, v.name, v.code
FROM (VALUES
  ('northeast', 'New York East', 'new-york-east'),
  ('northeast', 'New York West', 'new-york-west'),
  ('northeast', 'New Jersey South', 'new-jersey-south'),
  ('northeast', 'New Jersey Central', 'new-jersey-central'),
  ('northeast', 'New Jersey North', 'new-jersey-north'),
  ('northeast', 'Massachusetts', 'massachusetts'),
  ('northeast', 'Connecticut', 'connecticut'),
  ('northeast', 'Pennsylvania', 'pennsylvania'),
  ('south', 'Houston', 'houston'),
  ('south', 'Dallas East', 'dallas-east'),
  ('south', 'Dallas West', 'dallas-west'),
  ('south', 'Dallas Expansions', 'dallas-expansions'),
  ('midwest', 'Chicago', 'chicago'),
  ('midwest', 'Kentucky', 'kentucky'),
  ('midwest', 'Minnesota', 'minnesota'),
  ('southeast', 'Georgia', 'georgia'),
  ('southeast', 'Florida', 'florida'),
  ('dmv', 'Northern Virginia', 'northern-virginia'),
  ('dmv', 'Central/South Virginia', 'central-south-virginia'),
  ('dmv', 'Maryland', 'maryland'),
  ('dmv', 'West Virginia', 'west-virginia'),
  ('west', 'Washington', 'washington'),
  ('west', 'West', 'west')
) AS v(region_code, name, code)
JOIN regions r ON r.code = v.region_code
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, region_id = EXCLUDED.region_id,
      is_active = true, updated_at = now();

-- 3c. NeighborNets  (subregion_code, name)
-- No unique constraint on neighbor_nets — the NOT EXISTS guard keeps this
-- re-runnable and prevents duplicate (subregion, name) pairs.
INSERT INTO neighbor_nets (subregion_id, name)
SELECT s.id, v.name
FROM (VALUES
  ('new-york-east', 'Jamaica'),
  ('new-york-east', 'Queens Village'),
  ('new-york-east', 'Valley Stream'),
  ('new-york-east', 'Shelter Rock'),
  ('new-york-east', 'East Meadow'),
  ('new-york-east', 'Melville'),
  ('new-york-east', 'Deer Park'),
  ('new-york-east', 'Ronkonkoma'),
  ('new-york-east', 'NYIT'),
  ('new-york-west', 'Brooklyn'),
  ('new-york-west', 'Westchester'),
  ('new-york-west', 'White Plains'),
  ('new-york-west', 'Stamford'),
  ('new-york-west', 'Rockland'),
  ('new-jersey-south', '571'),
  ('new-jersey-south', 'Montyboro'),
  ('new-jersey-south', 'South Jersey'),
  ('new-jersey-south', 'South Brunswick'),
  ('new-jersey-south', 'Blackwood'),
  ('new-jersey-central', 'Piscataway'),
  ('new-jersey-central', 'Woodbridge'),
  ('new-jersey-central', 'Old Bridge'),
  ('new-jersey-central', 'Edison'),
  ('new-jersey-north', 'Bayonne'),
  ('new-jersey-north', 'Newark'),
  ('new-jersey-north', 'North Hudson'),
  ('new-jersey-north', 'Wayne'),
  ('new-jersey-north', 'Jersey City'),
  ('new-jersey-north', 'Paramus'),
  ('new-jersey-north', 'Morris County'),
  ('new-jersey-north', 'Teaneck'),
  ('massachusetts', 'Lowell'),
  ('massachusetts', 'Metrowest'),
  ('massachusetts', 'Pawtucket'),
  ('massachusetts', 'Sharon'),
  ('massachusetts', 'Quincy'),
  ('massachusetts', 'Worcester'),
  ('connecticut', 'Berlin'),
  ('connecticut', 'Windsor Locks'),
  ('connecticut', 'New Britain'),
  ('connecticut', 'Middletown'),
  ('connecticut', 'New Haven'),
  ('pennsylvania', 'Harrisburg'),
  ('pennsylvania', 'Norristown'),
  ('pennsylvania', 'North Penn'),
  ('pennsylvania', 'Khair'),
  ('pennsylvania', 'Penn'),
  ('pennsylvania', 'Devon'),
  ('pennsylvania', 'West Chester'),
  ('pennsylvania', 'Upper Darby'),
  ('houston', 'Masjid Maryam'),
  ('houston', 'Clear Lake'),
  ('houston', 'Bear Creek'),
  ('houston', 'Cinco Ranch'),
  ('houston', 'College Station'),
  ('houston', 'Synott'),
  ('houston', 'River Oaks'),
  ('houston', 'Pearland'),
  ('houston', 'Spring'),
  ('houston', 'Cypress'),
  ('dallas-east', 'Prosper'),
  ('dallas-east', 'East Plano'),
  ('dallas-east', 'Richardson'),
  ('dallas-east', 'Frisco'),
  ('dallas-west', 'Carrollton'),
  ('dallas-west', 'Valley Ranch'),
  ('dallas-west', 'Euless'),
  ('dallas-expansions', 'Irving'),
  ('dallas-expansions', '75'),
  ('dallas-expansions', 'Colleyville'),
  ('dallas-expansions', 'Southlake'),
  ('chicago', 'IFN'),
  ('chicago', 'Niles'),
  ('chicago', 'Westside'),
  ('chicago', 'Plainfield'),
  ('chicago', 'Potter'),
  ('chicago', 'Bolingbrook'),
  ('chicago', 'Wheaton'),
  ('chicago', 'ICWS'),
  ('kentucky', 'Bowling Green'),
  ('kentucky', 'Lexington'),
  ('kentucky', '4th St'),
  ('minnesota', 'Blaine'),
  ('georgia', 'Alpharetta'),
  ('georgia', 'Lilburn'),
  ('georgia', 'Suwanee'),
  ('georgia', 'Roswell'),
  ('georgia', 'East Cobb'),
  ('georgia', 'Cumming'),
  ('florida', 'Pompano'),
  ('florida', 'Pines'),
  ('florida', 'SoFlo'),
  ('florida', 'Gainesville - FL'),
  ('florida', 'St Johns'),
  ('florida', 'Jacksonville'),
  ('northern-virginia', 'Gainesville - VA'),
  ('northern-virginia', 'Woodbridge - VA'),
  ('northern-virginia', 'Falls Church'),
  ('northern-virginia', 'Sterling'),
  ('northern-virginia', 'Burke'),
  ('central-south-virginia', 'Chesterfield'),
  ('central-south-virginia', 'Glen Allen'),
  ('central-south-virginia', 'Virginia Tech'),
  ('maryland', 'Salisbury'),
  ('maryland', 'Gaithersburg'),
  ('maryland', 'Baltimore'),
  ('maryland', 'Whitemarsh'),
  ('maryland', 'Annapolis'),
  ('maryland', 'Lanham'),
  ('maryland', 'Silver Spring'),
  ('west-virginia', 'Morgantown'),
  ('west-virginia', 'Huntington'),
  ('west-virginia', 'Charleston'),
  ('washington', 'Bellevue'),
  ('washington', 'Bothell'),
  ('west', 'LV'),
  ('west', 'AZ'),
  ('west', 'LA')
) AS v(subregion_code, name)
JOIN subregions s ON s.code = v.subregion_code
WHERE NOT EXISTS (
  SELECT 1 FROM neighbor_nets n
  WHERE n.subregion_id = s.id AND n.name = v.name
);
