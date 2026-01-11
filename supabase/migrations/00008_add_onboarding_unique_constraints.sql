-- Add unique constraints to prevent duplicate inserts during onboarding
-- These prevent race conditions when users double-click "Next" button

-- For role_assignments: prevent duplicate roles for same user/type/date
-- Handle both standard role types and custom roles separately

-- Unique constraint for standard (non-custom) role types
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_assignments_unique
  ON role_assignments(user_id, role_type_id, start_date)
  WHERE role_type_id IS NOT NULL AND role_type_custom IS NULL;

-- Unique constraint for custom role types
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_assignments_custom_unique
  ON role_assignments(user_id, role_type_custom, start_date)
  WHERE role_type_custom IS NOT NULL AND role_type_id IS NULL;

-- For user_projects: prevent duplicate projects for same user/type/dates
-- Handle both standard project types and custom project types separately

-- Unique constraint for standard (non-custom) project types
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_projects_unique
  ON user_projects(user_id, project_type, start_year, start_month)
  WHERE project_type IS NOT NULL AND project_type_custom IS NULL;

-- Unique constraint for custom project types
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_projects_custom_unique
  ON user_projects(user_id, project_type_custom, start_year, start_month)
  WHERE project_type_custom IS NOT NULL AND project_type IS NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_role_assignments_unique IS 'Prevents duplicate role assignments for same user, role type, and start date';
COMMENT ON INDEX idx_role_assignments_custom_unique IS 'Prevents duplicate custom role assignments for same user, custom role, and start date';
COMMENT ON INDEX idx_user_projects_unique IS 'Prevents duplicate projects for same user, project type, and start date';
COMMENT ON INDEX idx_user_projects_custom_unique IS 'Prevents duplicate custom projects for same user, custom project type, and start date';
