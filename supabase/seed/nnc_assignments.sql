-- ============================================================================
-- YM App — NeighborNet Coordinator (NNC) role_assignments
-- ============================================================================
-- GENERATED — do not edit by hand. Regenerate:
--   node docs/geography/generate-nnc-assignments.mjs
--
-- POST-SYNC fixture (NOT canonical seed): requires `users` populated by
-- `bun run sync:google`. Idempotent + self-resolving:
--   - an email with no matching user row is skipped (dropped by the JOIN),
--   - NOT EXISTS enforces one NNC per NN,
--   - re-running is a no-op.
-- ============================================================================
WITH roster(sr_code, nn_name, email) AS (
  VALUES
    ('NYE', 'Jamaica', 'rumaiz.ahmed@youngmuslims.com'),
    ('NYE', 'Queens Village', 'neeam.hayder@youngmuslims.com'),
    ('NYE', 'Shelter Rock', 'yusuf.jummani@youngmuslims.com'),
    ('NYE', 'East Meadow', 'syed.n.hussainy@youngmuslims.com'),
    ('NYE', 'Melville', 'saabir.beig@youngmuslims.com'),
    ('NYE', 'Deer Park', 'sabeeh.hassany@youngmuslims.com'),
    ('NYE', 'Ronkonkoma', 'adib.bari@youngmuslims.com'),
    ('NYE', 'NYIT', 'hamza.khan2@youngmuslims.com'),
    ('NYW', 'Brooklyn', 'shujah.malhi@youngmuslims.com'),
    ('NYW', 'Westchester', 'ramish.warraich@youngmuslims.com'),
    ('NYW', 'White Plains', 'rajin.hossain@youngmuslims.com'),
    ('NYW', 'Stamford', 'fujael.hossain@youngmuslims.com'),
    ('NJS', '571', 'mohamed.kareem@youngmuslims.com'),
    ('NJS', 'Montyboro', 'kasim.ali@youngmuslims.com'),
    ('NJS', 'South Jersey', 'umar.siddiqui@youngmuslims.com'),
    ('NJS', 'South Brunswick', 'syed.huzaifa@youngmuslims.com'),
    ('NJC', 'Piscataway', 'maaz.motiwala@youngmuslims.com'),
    ('NJC', 'Old Bridge', 'zakiriyah.daftani@youngmuslims.com'),
    ('NJC', 'Edison', 'muhammad.abdullah@youngmuslims.com'),
    ('NJN', 'Bayonne', 'muadh.ali@youngmuslims.com'),
    ('NJN', 'Newark', 'kareem.bacchus@youngmuslims.com'),
    ('NJN', 'North Hudson', 'wisam.selim@youngmuslims.com'),
    ('NJN', 'Jersey City', 'youssef.ege@youngmuslims.com'),
    ('NJN', 'Paramus', 'amir.asror@youngmuslims.com'),
    ('NJN', 'Morris County', 'ahmed.salem@youngmuslims.com'),
    ('NJN', 'Teaneck', 'ahmmad.halak@youngmuslims.com'),
    ('HOU', 'Masjid Maryam', 'dominic.reddick@youngmuslims.com'),
    ('HOU', 'Clear Lake', 'ahmad.kharfan@youngmuslims.com'),
    ('HOU', 'Bear Creek', 'ali.rashada@youngmuslims.com'),
    ('HOU', 'Cinco Ranch', 'ali.syed@youngmuslims.com'),
    ('HOU', 'College Station', 'mohamed.sabri@youngmuslims.com'),
    ('HOU', 'Synott', 'shahzaib.vohra@youngmuslims.com'),
    ('HOU', 'River Oaks', 'mohamed.mehaisi@youngmuslims.com'),
    ('HOU', 'Pearland', 'aqib.waheed@youngmuslims.com'),
    ('HOU', 'Spring', 'mohammad.ahsan@youngmuslims.com'),
    ('HOU', 'Cypress', 'luqman.abdali@youngmuslims.com'),
    ('DLE', 'Prosper', 'hazef.iqbal@youngmuslims.com'),
    ('DLE', 'East Plano', 'muhammad.hasnie@youngmuslims.com'),
    ('DLE', 'Richardson', 'ziyaad.aziz@youngmuslims.com'),
    ('DLE', 'Frisco', 'fahad.faisal@youngmuslims.com'),
    ('DLW', 'Carrollton', 'omar.abdullahi@youngmuslims.com'),
    ('DLW', 'Valley Ranch', 'zaid.syed@youngmuslims.com'),
    ('DLW', 'Euless', 'mohamed.eljack@youngmuslims.com'),
    ('CHI', 'IFN', 'zabhi.syed@youngmuslims.com'),
    ('CHI', 'Niles', 'areeb.siddiqui@youngmuslims.com'),
    ('CHI', 'Westside', 'ameen.khalid@youngmuslims.com'),
    ('CHI', 'Plainfield', 'ali.gondal@youngmuslims.com'),
    ('CHI', 'Potter', 'ahmed.minih@youngmuslims.com'),
    ('CHI', 'Bolingbrook', 'maaz.chaudhry@youngmuslims.com'),
    ('CHI', 'Wheaton', 'yousuf.syed@youngmuslims.com'),
    ('CHI', 'ICWS', 'faizaan.ahmed@youngmuslims.com'),
    ('MA', 'Lowell', 'hassan.jafri@youngmuslims.com'),
    ('MA', 'Metrowest', 'abdullah.mohammed@youngmuslims.com'),
    ('MA', 'Pawtucket', 'hanzalah.qamar@youngmuslims.com'),
    ('MA', 'Sharon', 'yussuf.nasri@youngmuslims.com'),
    ('MA', 'Quincy', 'yoseph.hassan@youngmuslims.com'),
    ('MA', 'Worcester', 'amin.badmos@youngmuslims.com'),
    ('KY', 'Bowling Green', 'imamulhaq.brula@youngmuslims.com'),
    ('CT', 'Berlin', 'mujtaba.ather@youngmuslims.com'),
    ('CT', 'Windsor Locks', 'ahmad.zoghol@youngmuslims.com'),
    ('CT', 'Middletown', 'ahmed.elsaadani@youngmuslims.com'),
    ('CT', 'New Haven', 'luay.lpizra@youngmuslims.com'),
    ('FL', 'Pompano', 'anas.dahrouj@youngmuslims.com'),
    ('FL', 'SoFlo', 'taaha.dandia@youngmuslims.com'),
    ('FL', 'St Johns', 'zakariya.lakhani@youngmuslims.com'),
    ('FL', 'Jacksonville', 'moussa.wood@youngmuslims.com'),
    ('NVA', 'Gainesville - VA', 'muhammad.shaaf@youngmuslims.com'),
    ('NVA', 'Woodbridge - VA', 'dawood.ibrahim@youngmuslims.com'),
    ('NVA', 'Falls Church', 'ziyad.yousif@youngmuslims.com'),
    ('NVA', 'Sterling', 'musa.shareef@youngmuslims.com'),
    ('CSVA', 'Virginia Tech', 'ayman.sharieff@youngmuslims.com'),
    ('MD', 'Salisbury', 'akkad.alzayady@youngmuslims.com'),
    ('MD', 'Gaithersburg', 'tousif.pervez@youngmuslims.com'),
    ('MD', 'Baltimore', 'ahmad.sayad@youngmuslims.com'),
    ('MD', 'Whitemarsh', 'saad.ijaz@youngmuslims.com'),
    ('MD', 'Annapolis', 'ibraheem.zia@youngmuslims.com'),
    ('MD', 'Lanham', 'rayn.ali@youngmuslims.com'),
    ('MD', 'Silver Spring', 'khalid.abdullahi@youngmuslims.com'),
    ('PA', 'Harrisburg', 'hamza.waheed@youngmuslims.com'),
    ('PA', 'Khair', 'rayyan.tausif@youngmuslims.com'),
    ('PA', 'Penn', 'abdullah.goher@youngmuslims.com'),
    ('PA', 'Devon', 'najm.ferjani@youngmuslims.com'),
    ('PA', 'Upper Darby', 'saminur.rahman@youngmuslims.com'),
    ('WA', 'Bellevue', 'abdullah.azmy@youngmuslims.com'),
    ('WA', 'Bothell', 'ibrahim.adil@youngmuslims.com'),
    ('WV', 'Morgantown', 'abdulmajeed.tarabishy@youngmuslims.com')
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
