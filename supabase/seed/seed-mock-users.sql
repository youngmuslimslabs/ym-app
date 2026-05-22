-- Seed Mock Users for Testing Load More Pagination
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ================================================================

-- Create 30 mock users
INSERT INTO users (email, first_name, last_name, phone, skills, onboarding_completed_at) VALUES
  ('ahmed.khan@test.ym.org', 'Ahmed', 'Khan', '555-0101', ARRAY['leadership', 'public-speaking'], NOW()),
  ('fatima.ali@test.ym.org', 'Fatima', 'Ali', '555-0102', ARRAY['marketing', 'design'], NOW()),
  ('omar.hassan@test.ym.org', 'Omar', 'Hassan', '555-0103', ARRAY['web-development', 'project-management'], NOW()),
  ('aisha.mohamed@test.ym.org', 'Aisha', 'Mohamed', '555-0104', ARRAY['event-planning', 'fundraising'], NOW()),
  ('yusuf.ahmed@test.ym.org', 'Yusuf', 'Ahmed', '555-0105', ARRAY['finance', 'operations'], NOW()),
  ('mariam.ibrahim@test.ym.org', 'Mariam', 'Ibrahim', '555-0106', ARRAY['education', 'mentorship'], NOW()),
  ('ibrahim.saleh@test.ym.org', 'Ibrahim', 'Saleh', '555-0107', ARRAY['it', 'data-analysis'], NOW()),
  ('zahra.hussein@test.ym.org', 'Zahra', 'Hussein', '555-0108', ARRAY['communications', 'social-media'], NOW()),
  ('hamza.rashid@test.ym.org', 'Hamza', 'Rashid', '555-0109', ARRAY['leadership', 'strategy'], NOW()),
  ('khadija.omar@test.ym.org', 'Khadija', 'Omar', '555-0110', ARRAY['hr', 'recruitment'], NOW()),
  ('bilal.mansoor@test.ym.org', 'Bilal', 'Mansoor', '555-0111', ARRAY['logistics', 'operations'], NOW()),
  ('sara.ahmed@test.ym.org', 'Sara', 'Ahmed', '555-0112', ARRAY['marketing', 'content-creation'], NOW()),
  ('adam.khan@test.ym.org', 'Adam', 'Khan', '555-0113', ARRAY['web-development', 'mobile-dev'], NOW()),
  ('layla.hassan@test.ym.org', 'Layla', 'Hassan', '555-0114', ARRAY['design', 'ux-research'], NOW()),
  ('malik.ali@test.ym.org', 'Malik', 'Ali', '555-0115', ARRAY['finance', 'accounting'], NOW()),
  ('amina.rashid@test.ym.org', 'Amina', 'Rashid', '555-0116', ARRAY['education', 'curriculum-dev'], NOW()),
  ('tariq.hussein@test.ym.org', 'Tariq', 'Hussein', '555-0117', ARRAY['project-management', 'agile'], NOW()),
  ('nadia.saleh@test.ym.org', 'Nadia', 'Saleh', '555-0118', ARRAY['communications', 'pr'], NOW()),
  ('kareem.ibrahim@test.ym.org', 'Kareem', 'Ibrahim', '555-0119', ARRAY['fundraising', 'donor-relations'], NOW()),
  ('hana.mohamed@test.ym.org', 'Hana', 'Mohamed', '555-0120', ARRAY['event-planning', 'hospitality'], NOW()),
  ('zaid.omar@test.ym.org', 'Zaid', 'Omar', '555-0121', ARRAY['leadership', 'public-speaking'], NOW()),
  ('maryam.khan@test.ym.org', 'Maryam', 'Khan', '555-0122', ARRAY['social-media', 'video-editing'], NOW()),
  ('hassan.ali@test.ym.org', 'Hassan', 'Ali', '555-0123', ARRAY['it', 'cybersecurity'], NOW()),
  ('sumaya.ahmed@test.ym.org', 'Sumaya', 'Ahmed', '555-0124', ARRAY['hr', 'training'], NOW()),
  ('idris.mansoor@test.ym.org', 'Idris', 'Mansoor', '555-0125', ARRAY['strategy', 'analytics'], NOW()),
  ('yasmin.hassan@test.ym.org', 'Yasmin', 'Hassan', '555-0126', ARRAY['design', 'branding'], NOW()),
  ('khalid.rashid@test.ym.org', 'Khalid', 'Rashid', '555-0127', ARRAY['operations', 'supply-chain'], NOW()),
  ('asma.hussein@test.ym.org', 'Asma', 'Hussein', '555-0128', ARRAY['mentorship', 'coaching'], NOW()),
  ('faisal.saleh@test.ym.org', 'Faisal', 'Saleh', '555-0129', ARRAY['finance', 'budgeting'], NOW()),
  ('rania.ibrahim@test.ym.org', 'Rania', 'Ibrahim', '555-0130', ARRAY['marketing', 'campaigns'], NOW());

-- Create memberships for all mock users (distribute across 3 NeighborNets)
INSERT INTO memberships (user_id, neighbor_net_id, status, joined_at)
SELECT
  u.id,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 3 = 0 THEN 'dc550553-59e8-49a7-8b6b-21ff4c789596'::uuid  -- Katy NN
    WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) % 3 = 1 THEN 'c4725433-430a-497d-a0e3-90f496e61d71'::uuid  -- Sugar Land NN
    ELSE '185671c0-7457-45c0-8d27-c18d5eed6d39'::uuid  -- Downtown NN
  END,
  'active',
  CURRENT_DATE - (RANDOM() * 365)::int
FROM users u
WHERE u.email LIKE '%@test.ym.org'
  AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = u.id);

-- Add some role assignments for variety
INSERT INTO role_assignments (user_id, role_type_id, is_active, start_date)
SELECT
  u.id,
  (SELECT id FROM role_types WHERE code = 'ct_member' LIMIT 1),
  true,
  CURRENT_DATE - (RANDOM() * 180)::int
FROM users u
WHERE u.email LIKE '%@test.ym.org'
  AND NOT EXISTS (SELECT 1 FROM role_assignments ra WHERE ra.user_id = u.id)
LIMIT 15;  -- Give 15 users a "Core Team Member" role

-- Verify the results
SELECT
  (SELECT COUNT(*) FROM users WHERE onboarding_completed_at IS NOT NULL) as total_users,
  (SELECT COUNT(*) FROM memberships WHERE status = 'active') as total_memberships,
  (SELECT COUNT(*) FROM role_assignments WHERE is_active = true) as total_roles;
