-- Migration: Create all tables
-- Run after enums are created
-- ==============================

-- ============================================
-- USERS TABLE
-- Core user data including all onboarding fields
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity & Auth
  email TEXT UNIQUE NOT NULL,                    -- GSuite email, linking key
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL, -- Linked on first login
  claimed_at TIMESTAMPTZ,                        -- When they first logged in

  -- Basic Profile
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,

  -- Extended Profile (Onboarding Step 1)
  personal_email TEXT,                           -- Non-GSuite email
  ethnicity TEXT,
  date_of_birth DATE,

  -- Education (Onboarding Step 5)
  education_level TEXT,                          -- 'high-school-current', 'high-school-graduate', 'college'
  education JSONB DEFAULT '[]'::jsonb,           -- Array of {school_name, degree_type, field_of_study, graduation_year}

  -- Skills (Onboarding Step 6)
  skills TEXT[] DEFAULT '{}',                    -- Array of skill IDs like ['leadership', 'public-speaking']

  -- Metadata
  onboarding_completed_at TIMESTAMPTZ,           -- NULL until onboarding is done
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for auth lookups
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- GEOGRAPHIC HIERARCHY
-- Region → Subregion → NeighborNet
-- ============================================

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,                     -- e.g., 'TX', 'NY', 'SE'
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE subregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,                     -- e.g., 'HOU', 'DAL'
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_subregions_region ON subregions(region_id);

CREATE TABLE neighbor_nets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subregion_id UUID NOT NULL REFERENCES subregions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_neighbor_nets_subregion ON neighbor_nets(subregion_id);

-- ============================================
-- CABINET STRUCTURE
-- Departments and Teams
-- ============================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_teams_department ON teams(department_id);

-- ============================================
-- MEMBERSHIPS
-- "Where you BELONG geographically"
-- ============================================

CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Geographic location (one of these will be set)
  neighbor_net_id UUID REFERENCES neighbor_nets(id),  -- For regular members
  region_id UUID REFERENCES regions(id),              -- For NS members (region-level)

  -- Status
  status membership_status DEFAULT 'active' NOT NULL,
  joined_at DATE,
  left_at DATE,                                       -- NULL if still active

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
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

-- Ensure only one active membership per user
CREATE UNIQUE INDEX idx_memberships_user_active ON memberships(user_id) WHERE status = 'active';

-- ============================================
-- ROLE SYSTEM
-- "What you DO functionally"
-- ============================================

CREATE TABLE role_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                     -- e.g., 'National Coordinator'
  code TEXT UNIQUE NOT NULL,                     -- e.g., 'nc'
  category role_category NOT NULL,
  scope_type scope_type NOT NULL,
  max_per_scope INTEGER,                         -- NULL = unlimited
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,         -- hierarchy ordering; values set in 00010
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role (either predefined or custom)
  role_type_id UUID REFERENCES role_types(id),   -- NULL if custom role
  role_type_custom TEXT,                         -- Used if not in predefined list

  -- Scope (varies by role_type.scope_type)
  scope_id UUID,                                 -- References different tables based on scope_type

  -- Amir/Manager
  amir_user_id UUID REFERENCES users(id),        -- If amir is in the system
  amir_custom_name TEXT,                         -- If amir is not in the system

  -- Date range
  start_date DATE,
  end_date DATE,                                 -- NULL = currently active
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- At least one of role_type_id or role_type_custom must be set
  CONSTRAINT role_assignment_has_role CHECK (
    role_type_id IS NOT NULL OR role_type_custom IS NOT NULL
  )
);

CREATE INDEX idx_role_assignments_user ON role_assignments(user_id);
CREATE INDEX idx_role_assignments_role_type ON role_assignments(role_type_id);
CREATE INDEX idx_role_assignments_scope ON role_assignments(scope_id);
CREATE INDEX idx_role_assignments_active ON role_assignments(is_active);
CREATE INDEX idx_role_assignments_amir ON role_assignments(amir_user_id);

-- ============================================
-- USER PROJECTS
-- YM projects/events you've worked on
-- ============================================

CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Project info
  project_type TEXT,                             -- 'convention', 'retreat', etc.
  project_type_custom TEXT,                      -- If not in predefined list
  role TEXT,                                     -- User's role, e.g., "Logistics Lead"
  description TEXT,                              -- What they did

  -- Amir/Manager
  amir_user_id UUID REFERENCES users(id),        -- If amir is in the system
  amir_custom_name TEXT,                         -- If amir is not in the system

  -- Date range (month/year granularity)
  start_month INTEGER CHECK (start_month >= 1 AND start_month <= 12),
  start_year INTEGER CHECK (start_year >= 1980 AND start_year <= 2100),
  end_month INTEGER CHECK (end_month >= 1 AND end_month <= 12),
  end_year INTEGER CHECK (end_year >= 1980 AND end_year <= 2100),
  is_current BOOLEAN DEFAULT false NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Must have either predefined or custom project type
  CONSTRAINT project_has_type CHECK (
    project_type IS NOT NULL OR project_type_custom IS NOT NULL
  ),

  -- Validate predefined project types
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

-- ============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subregions_updated_at
  BEFORE UPDATE ON subregions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_neighbor_nets_updated_at
  BEFORE UPDATE ON neighbor_nets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_role_assignments_updated_at
  BEFORE UPDATE ON role_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
