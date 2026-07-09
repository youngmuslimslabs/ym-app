-- ============================================
-- COMBINED MIGRATION SCRIPT
-- Run this in Supabase SQL Editor to set up the entire schema
-- Generated: February 2026
-- ============================================

-- ============================================
-- 1. DROP OLD TABLES
-- ============================================

DROP TABLE IF EXISTS cloud_coordinators CASCADE;
DROP TABLE IF EXISTS cloud_members CASCADE;
DROP TABLE IF EXISTS core_team_members CASCADE;
DROP TABLE IF EXISTS national_shura CASCADE;
DROP TABLE IF EXISTS national_shura_coordinator CASCADE;
DROP TABLE IF EXISTS regional_coordinators CASCADE;
DROP TABLE IF EXISTS sr_coordinators CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS neighbor_nets CASCADE;
DROP TABLE IF EXISTS subregions CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS role_category CASCADE;
DROP TYPE IF EXISTS scope_type CASCADE;

-- ============================================
-- 2. CREATE ENUMS
-- ============================================

CREATE TYPE membership_status AS ENUM ('active', 'alumni', 'inactive');

CREATE TYPE role_category AS ENUM (
  'ns', 'council', 'regional', 'subregional', 'neighbor_net', 'cabinet', 'cloud'
);

CREATE TYPE scope_type AS ENUM (
  'national', 'region', 'subregion', 'neighbor_net', 'department', 'team'
);

-- ============================================
-- 3. CREATE TABLES
-- ============================================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  personal_email TEXT,
  ethnicity TEXT,
  date_of_birth DATE,
  education_level TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  skills TEXT[] DEFAULT '{}',
  onboarding_completed_at TIMESTAMPTZ,
  profile_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_onboarding ON users(onboarding_completed_at);

-- Regions
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Subregions
CREATE TABLE subregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_subregions_region ON subregions(region_id);

-- NeighborNets
CREATE TABLE neighbor_nets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subregion_id UUID NOT NULL REFERENCES subregions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_neighbor_nets_subregion ON neighbor_nets(subregion_id);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_teams_department ON teams(department_id);

-- Memberships
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  neighbor_net_id UUID REFERENCES neighbor_nets(id),
  region_id UUID REFERENCES regions(id),
  status membership_status DEFAULT 'active' NOT NULL,
  joined_at DATE,
  left_at DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT membership_location CHECK (
    (neighbor_net_id IS NOT NULL AND region_id IS NULL) OR
    (neighbor_net_id IS NULL AND region_id IS NOT NULL) OR
    (neighbor_net_id IS NULL AND region_id IS NULL)
  )
);

CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_nn ON memberships(neighbor_net_id);
CREATE INDEX idx_memberships_region ON memberships(region_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE UNIQUE INDEX idx_memberships_user_active ON memberships(user_id) WHERE status = 'active';

-- Role Types
CREATE TABLE role_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category role_category NOT NULL,
  scope_type scope_type NOT NULL,
  max_per_scope INTEGER,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Role Assignments
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type_id UUID REFERENCES role_types(id),
  role_type_custom TEXT,
  scope_id UUID,
  amir_user_id UUID REFERENCES users(id),
  amir_custom_name TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT role_assignment_has_role CHECK (
    role_type_id IS NOT NULL OR role_type_custom IS NOT NULL
  )
);

CREATE INDEX idx_role_assignments_user ON role_assignments(user_id);
CREATE INDEX idx_role_assignments_role_type ON role_assignments(role_type_id);
CREATE INDEX idx_role_assignments_scope ON role_assignments(scope_id);
CREATE INDEX idx_role_assignments_active ON role_assignments(is_active);
CREATE INDEX idx_role_assignments_amir ON role_assignments(amir_user_id);

-- User Projects
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_type TEXT,
  project_type_custom TEXT,
  role TEXT,
  description TEXT,
  amir_user_id UUID REFERENCES users(id),
  amir_custom_name TEXT,
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER CHECK (start_year >= 1980 AND start_year <= 2100),
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER CHECK (end_year >= 1980 AND end_year <= 2100),
  is_current BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT project_has_type CHECK (
    project_type IS NOT NULL OR project_type_custom IS NOT NULL
  ),
  CONSTRAINT valid_project_type CHECK (
    project_type IS NULL OR
    project_type IN ('convention', 'retreat', 'fundraiser', 'workshop',
                     'community-event', 'training', 'outreach', 'social',
                     'service', 'sports')
  )
);

CREATE INDEX idx_user_projects_user ON user_projects(user_id);
CREATE INDEX idx_user_projects_type ON user_projects(project_type);
CREATE INDEX idx_user_projects_amir ON user_projects(amir_user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subregions_updated_at BEFORE UPDATE ON subregions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_neighbor_nets_updated_at BEFORE UPDATE ON neighbor_nets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_role_assignments_updated_at BEFORE UPDATE ON role_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. SEED DATA
-- ============================================

INSERT INTO role_types (name, code, category, scope_type, max_per_scope, description, sort_order) VALUES
  ('NeighborNet Coordinator', 'nnc', 'neighbor_net', 'neighbor_net', 1, 'Leads a NeighborNet', 1),
  ('Core Team Member', 'ct_member', 'neighbor_net', 'neighbor_net', NULL, 'NN core team member', 2),
  ('Sub-Regional Coordinator', 'src', 'subregional', 'subregion', 1, 'Leads a subregion', 3),
  ('Sub-Regional Secretary General', 'sr_sg', 'subregional', 'subregion', 1, 'Subregion secretary', 4),
  ('Regional Coordinator', 'rc', 'council', 'region', 1, 'Leads a region', 5),
  ('Regional Cloud Rep', 'reg_cloud_rep', 'regional', 'region', 1, 'Regional Cloud representative', 6),
  ('Regional Special Projects', 'reg_special_proj', 'regional', 'region', 1, 'Regional special projects lead', 7),
  ('Cloud Coordinator', 'cloud_coord', 'cloud', 'subregion', 1, 'Leads Cloud in a subregion', 8),
  ('Cloud Member', 'cloud_member', 'cloud', 'subregion', NULL, 'Cloud program member', 9),
  ('Cabinet Chair', 'cabinet_chair', 'ns', 'national', 1, 'Leads the Cabinet', 10),
  ('Cabinet Secretary General', 'cabinet_sg', 'cabinet', 'national', 1, 'Cabinet secretary', 11),
  ('Department Head', 'dept_head', 'cabinet', 'department', 1, 'Leads a department', 12),
  ('Cabinet Team Lead', 'team_lead', 'cabinet', 'team', 1, 'Leads a team', 13),
  ('Cabinet Team Member', 'team_member', 'cabinet', 'team', NULL, 'Team member', 14),
  ('National Coordinator', 'nc', 'ns', 'national', 1, 'Head of the organization', 15),
  ('NS Secretary General', 'ns_sg', 'ns', 'national', 1, 'National Shura secretary', 16),
  ('Council Coordinator', 'council_coord', 'ns', 'national', 1, 'Coordinates The Council', 17),
  ('National Cloud Rep', 'nat_cloud_rep', 'ns', 'national', 1, 'National representative for Cloud', 18),
  ('NS Member', 'ns_member', 'ns', 'national', NULL, 'Member of National Shura', 19)
ON CONFLICT (code) DO NOTHING;

INSERT INTO departments (name, code) VALUES
  ('Marketing', 'marketing'),
  ('Human Resources', 'hr'),
  ('Operations', 'operations'),
  ('Special Projects', 'special_projects'),
  ('Fundraising', 'fundraising'),
  ('Finance', 'finance'),
  ('IT', 'it'),
  ('Societal Impact', 'societal_impact')
ON CONFLICT (code) DO NOTHING;

-- Sample region
INSERT INTO regions (name, code) VALUES ('Texas', 'TX') ON CONFLICT (code) DO NOTHING;

-- Sample subregions
INSERT INTO subregions (region_id, name, code)
SELECT r.id, 'Houston', 'HOU' FROM regions r WHERE r.code = 'TX'
ON CONFLICT (code) DO NOTHING;
INSERT INTO subregions (region_id, name, code)
SELECT r.id, 'Dallas', 'DAL' FROM regions r WHERE r.code = 'TX'
ON CONFLICT (code) DO NOTHING;

-- Sample NeighborNets
INSERT INTO neighbor_nets (subregion_id, name)
SELECT s.id, 'Katy NN' FROM subregions s WHERE s.code = 'HOU'
  AND NOT EXISTS (SELECT 1 FROM neighbor_nets n WHERE n.name = 'Katy NN' AND n.subregion_id = s.id);
INSERT INTO neighbor_nets (subregion_id, name)
SELECT s.id, 'Sugar Land NN' FROM subregions s WHERE s.code = 'HOU'
  AND NOT EXISTS (SELECT 1 FROM neighbor_nets n WHERE n.name = 'Sugar Land NN' AND n.subregion_id = s.id);
INSERT INTO neighbor_nets (subregion_id, name)
SELECT s.id, 'Downtown NN' FROM subregions s WHERE s.code = 'HOU'
  AND NOT EXISTS (SELECT 1 FROM neighbor_nets n WHERE n.name = 'Downtown NN' AND n.subregion_id = s.id);

-- ============================================
-- 5. AUTH TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.link_auth_to_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@youngmuslims.com' THEN
    RETURN NEW;
  END IF;

  UPDATE public.users
  SET
    auth_id = NEW.id,
    claimed_at = now(),
    updated_at = now(),
    first_name = COALESCE(first_name, NEW.raw_user_meta_data->>'given_name'),
    last_name = COALESCE(last_name, NEW.raw_user_meta_data->>'family_name'),
    avatar_url = COALESCE(avatar_url, NEW.raw_user_meta_data->>'avatar_url')
  WHERE email = NEW.email
    AND auth_id IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.users (id, email, auth_id, first_name, last_name, avatar_url, claimed_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.email,
      NEW.id,
      NEW.raw_user_meta_data->>'given_name',
      NEW.raw_user_meta_data->>'family_name',
      NEW.raw_user_meta_data->>'avatar_url',
      now(),
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_auth_to_user();

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbor_nets ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());
CREATE POLICY "Authenticated users can view all users" ON users FOR SELECT USING (is_authenticated());

-- Geographic policies
CREATE POLICY "Authenticated users can view regions" ON regions FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view subregions" ON subregions FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view neighbor_nets" ON neighbor_nets FOR SELECT USING (is_authenticated());

-- Cabinet policies
CREATE POLICY "Authenticated users can view departments" ON departments FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view teams" ON teams FOR SELECT USING (is_authenticated());

-- Role_types policies
CREATE POLICY "Authenticated users can view role_types" ON role_types FOR SELECT USING (is_authenticated());

-- Memberships policies
CREATE POLICY "Users can view own memberships" ON memberships FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own memberships" ON memberships FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own memberships" ON memberships FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own memberships" ON memberships FOR DELETE USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all memberships" ON memberships FOR SELECT USING (is_authenticated());

-- Role_assignments policies
CREATE POLICY "Users can view own role_assignments" ON role_assignments FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own role_assignments" ON role_assignments FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own role_assignments" ON role_assignments FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own role_assignments" ON role_assignments FOR DELETE USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all role_assignments" ON role_assignments FOR SELECT USING (is_authenticated());

-- User_projects policies
CREATE POLICY "Users can view own projects" ON user_projects FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Users can insert own projects" ON user_projects FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own projects" ON user_projects FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own projects" ON user_projects FOR DELETE USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all projects" ON user_projects FOR SELECT USING (is_authenticated());

-- ============================================
-- DONE!
-- ============================================
