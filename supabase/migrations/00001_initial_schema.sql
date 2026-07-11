-- ============================================================================
-- YM App — Consolidated Baseline Schema
-- ============================================================================
-- Single source of truth for the database STRUCTURE. Squashed 2026-07-06 to
-- replace the previous 00001–00019 migration chain (all applied to a throwaway
-- pre-prod DB; prod will be wiped + rebuilt from this file before real users).
--
-- Reconstructed from the live schema via catalog introspection (exact function
-- bodies, policies, constraints, indexes), with two sets of changes folded in:
--
--   1. Cabinet naming
--        table  departments -> cabinet_departments
--        table  teams       -> cabinet_teams
--        enum   scope_type 'department'/'team' -> 'cabinet_department'/'cabinet_team'
--        (role "Department Head" -> "Cabinet Department Head" lives in seed.sql)
--
--   2. Additive changes
--        conferences  + scope_level (national/regional/subregional)
--                     + region_id, subregion_id, point_of_contact_user_id
--                     + hierarchy CHECK binding scope_level to which FK is set
--        memberships  + subregion_id, CHECK relaxed to "at most one location"
--        regions / subregions / neighbor_nets  + is_expansion
--
-- DATA lives in supabase/seed.sql (role_types only). `supabase db reset` runs
-- this file, then the seed.
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE membership_status AS ENUM ('active', 'alumni', 'inactive');

CREATE TYPE role_category AS ENUM (
  'ns', 'council', 'regional', 'subregional', 'neighbor_net', 'cabinet', 'cloud', 'system'
);

CREATE TYPE scope_type AS ENUM (
  'national', 'region', 'subregion', 'neighbor_net', 'cabinet_department', 'cabinet_team'
);

CREATE TYPE conference_status AS ENUM ('draft', 'published');

CREATE TYPE conference_scope_level AS ENUM ('national', 'regional', 'subregional');

-- ============================================================================
-- 2. SHARED updated_at TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- Users ----------------------------------------------------------------------
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
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_onboarding ON users(onboarding_completed_at);
CREATE INDEX idx_users_onboarding_incomplete ON users(id) WHERE onboarding_completed_at IS NULL;
CREATE UNIQUE INDEX users_email_lower_key ON users(lower(email));

-- Geographic hierarchy: region -> subregion -> neighbor_net ------------------
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_expansion BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE subregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable: some subregions are region-less expansion areas (e.g. DMV, West,
  -- Minnesota) that don't roll up to a named region. is_expansion is a separate
  -- axis — a subregion can be an expansion AND belong to a region.
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_expansion BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX idx_subregions_region ON subregions(region_id);

CREATE TABLE neighbor_nets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subregion_id UUID NOT NULL REFERENCES subregions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,          -- masjid / community-center name where the NN meets
  address TEXT,           -- street address (often blank in the roster)
  meeting_day TEXT,       -- weekday the NN meets, e.g. 'Friday' (free text)
  fundraising_link TEXT,  -- giving.ymsite.com campaign URL for the NN
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_expansion BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT neighbor_nets_subregion_name_unique UNIQUE (subregion_id, name)  -- no duplicate NN names within a subregion
);
CREATE INDEX idx_neighbor_nets_subregion ON neighbor_nets(subregion_id);

-- Cabinet structure: cabinet_department -> cabinet_team ----------------------
CREATE TABLE cabinet_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE cabinet_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES cabinet_departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT cabinet_teams_department_name_unique UNIQUE (department_id, name)  -- no duplicate team names within a department
);
CREATE INDEX idx_cabinet_teams_department ON cabinet_teams(department_id);

-- Memberships (geographic home) ----------------------------------------------
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  neighbor_net_id UUID REFERENCES neighbor_nets(id),
  subregion_id UUID REFERENCES subregions(id),
  region_id UUID REFERENCES regions(id),
  status membership_status DEFAULT 'active' NOT NULL,
  joined_at DATE,
  left_at DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Set the most specific geography known; at most one. All-null = unplaced
  -- (national team / loosely affiliated). Higher-level *scope* is a role, not
  -- a membership.
  CONSTRAINT membership_one_location CHECK (
    (neighbor_net_id IS NOT NULL)::int
    + (subregion_id IS NOT NULL)::int
    + (region_id IS NOT NULL)::int <= 1
  )
);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_nn ON memberships(neighbor_net_id);
CREATE INDEX idx_memberships_subregion ON memberships(subregion_id);
CREATE INDEX idx_memberships_region ON memberships(region_id);
CREATE INDEX idx_memberships_status ON memberships(status);
-- One active membership per user (guards onboarding double-submit)
CREATE UNIQUE INDEX idx_memberships_user_active ON memberships(user_id) WHERE status = 'active';

-- Role system ----------------------------------------------------------------
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

CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type_id UUID REFERENCES role_types(id),
  role_type_custom TEXT,
  scope_id UUID,                                   -- references a row in the table implied by role_types.scope_type (no FK; polymorphic)
  amir_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX idx_role_assignments_user_active_roles ON role_assignments(user_id, is_active) WHERE is_active = true;
-- Double-submit guards (users double-clicking "Next" in onboarding); standard vs custom roles handled separately
CREATE UNIQUE INDEX idx_role_assignments_unique ON role_assignments(user_id, role_type_id, start_date)
  WHERE role_type_id IS NOT NULL AND role_type_custom IS NULL;
CREATE UNIQUE INDEX idx_role_assignments_custom_unique ON role_assignments(user_id, role_type_custom, start_date)
  WHERE role_type_custom IS NOT NULL AND role_type_id IS NULL;

-- User projects --------------------------------------------------------------
CREATE TABLE user_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_type TEXT,
  project_type_custom TEXT,
  role TEXT,
  description TEXT,
  amir_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
    project_type IN ('convention','retreat','fundraiser','workshop',
                     'community-event','training','outreach','social','service','sports')
  )
);
CREATE INDEX idx_user_projects_user ON user_projects(user_id);
CREATE INDEX idx_user_projects_type ON user_projects(project_type);
CREATE INDEX idx_user_projects_amir ON user_projects(amir_user_id);
-- Double-submit guards; standard vs custom project types handled separately
CREATE UNIQUE INDEX idx_user_projects_unique ON user_projects(user_id, project_type, start_year, start_month)
  WHERE project_type IS NOT NULL AND project_type_custom IS NULL;
CREATE UNIQUE INDEX idx_user_projects_custom_unique ON user_projects(user_id, project_type_custom, start_year, start_month)
  WHERE project_type_custom IS NOT NULL AND project_type IS NULL;

-- Conferences ----------------------------------------------------------------
CREATE TABLE conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  location TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status conference_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  -- Geographic scope (folded-in additive change): a level + typed target.
  scope_level conference_scope_level NOT NULL DEFAULT 'national',
  region_id UUID REFERENCES regions(id),
  subregion_id UUID REFERENCES subregions(id),
  point_of_contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT conferences_us_timezone_check CHECK (
    timezone = ANY (ARRAY['America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles'])
  ),
  CHECK (end_date >= start_date),
  CHECK ((status = 'published') = (published_at IS NOT NULL)),
  -- national -> no target; regional -> region only; subregional -> region + subregion
  CONSTRAINT conferences_scope_valid CHECK (
    (scope_level = 'national'    AND region_id IS NULL     AND subregion_id IS NULL) OR
    (scope_level = 'regional'    AND region_id IS NOT NULL AND subregion_id IS NULL) OR
    (scope_level = 'subregional' AND region_id IS NOT NULL AND subregion_id IS NOT NULL)
  )
);

CREATE TABLE conference_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (conference_id, user_id)
);
CREATE INDEX idx_conf_attendees_user ON conference_attendees(user_id);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  room TEXT,
  is_break BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER,
  check_in_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (end_at > start_at),
  CHECK (NOT is_break OR (capacity IS NULL AND check_in_code IS NULL)),
  CHECK (capacity IS NULL OR capacity > 0)
);
CREATE INDEX idx_sessions_conference_start ON sessions(conference_id, start_at);

CREATE TABLE session_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_signups_session ON session_signups(session_id);
CREATE INDEX idx_signups_user ON session_signups(user_id);

CREATE TABLE session_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_checkins_session ON session_check_ins(session_id);

CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_feedback_session ON session_feedback(session_id);

-- Sync logs (Google Workspace user sync) -------------------------------------
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress','completed','failed')),
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  total_count INTEGER,
  created_count INTEGER,
  updated_count INTEGER,
  skipped_count INTEGER,
  errors_count INTEGER
);
CREATE UNIQUE INDEX sync_logs_one_active ON sync_logs(status) WHERE status = 'in_progress';
CREATE INDEX sync_logs_status_started_at ON sync_logs(status, started_at DESC);

-- ============================================================================
-- 4. FUNCTIONS (all SECURITY DEFINER unless noted; search_path pinned)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_event_admin(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_assignments ra
    JOIN role_types rt ON ra.role_type_id = rt.id
    WHERE ra.user_id = p_user_id
      AND rt.code = 'event_admin'
      AND ra.is_active
      AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
  );
$$;

-- Auth trigger: link an auth signup to its pre-seeded public.users row
-- (case-insensitive on email), or create one. GSuite-only.
CREATE OR REPLACE FUNCTION public.link_auth_to_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _email TEXT;
  _full_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
BEGIN
  _email := lower(trim(NEW.email));
  IF _email NOT LIKE '%@youngmuslims.com' THEN
    RETURN NEW;
  END IF;

  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  _first_name := split_part(_full_name, ' ', 1);
  _last_name := NULLIF(trim(substring(_full_name from position(' ' in _full_name) + 1)), '');
  IF _last_name = _first_name THEN
    _last_name := NULL;
  END IF;

  UPDATE public.users
  SET auth_id = NEW.id,
      claimed_at = now(),
      updated_at = now(),
      first_name = COALESCE(first_name, NULLIF(_first_name, '')),
      last_name = COALESCE(last_name, _last_name),
      avatar_url = COALESCE(avatar_url, NEW.raw_user_meta_data->>'avatar_url')
  WHERE lower(email) = _email
    AND auth_id IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.users (id, email, auth_id, first_name, last_name, avatar_url, claimed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _email, NEW.id, NULLIF(_first_name, ''), _last_name,
            NEW.raw_user_meta_data->>'avatar_url', now(), now(), now());
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_one_way_publish()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot unpublish a conference. Delete it instead.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_capacity_floor()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF NEW.capacity IS NOT NULL AND (OLD.capacity IS NULL OR NEW.capacity < OLD.capacity) THEN
    SELECT count(*) INTO current_count FROM session_signups WHERE session_id = NEW.id;
    IF NEW.capacity < current_count THEN
      RAISE EXCEPTION 'Cannot reduce capacity below current signup count (%).', current_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Sign up for a session: validates, locks the row, swaps out time-overlapping
-- signups, returns the replaced session ids.
CREATE OR REPLACE FUNCTION public.signup_for_session(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id UUID;
  v_target sessions%ROWTYPE;
  v_conf_status conference_status;
  v_current_count INTEGER;
  v_replaced UUID[];
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_target FROM sessions WHERE id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_target.is_break THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot sign up for a break');
  END IF;

  SELECT status INTO v_conf_status FROM conferences WHERE id = v_target.conference_id;
  IF v_conf_status IS DISTINCT FROM 'published' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conference not published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM conference_attendees
    WHERE conference_id = v_target.conference_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an attendee of this conference');
  END IF;

  IF EXISTS (
    SELECT 1 FROM session_signups WHERE session_id = p_session_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'replaced_session_ids', ARRAY[]::UUID[]);
  END IF;

  -- Server-side sign-up window, mirroring the UI's canSignUp and
  -- cancel_signup's bound: without this, a signup landing after the grace
  -- tail (stale client clock, direct RPC call) would be accepted and then be
  -- permanently uncancellable under the removability invariant (see 00022).
  IF now() >= v_target.end_at + interval '60 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sign-ups for this session have closed');
  END IF;

  IF v_target.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_current_count FROM session_signups WHERE session_id = p_session_id;
    IF v_current_count >= v_target.capacity THEN
      RETURN jsonb_build_object('success', false, 'error', 'Session full');
    END IF;
  END IF;

  WITH overlapping AS (
    DELETE FROM session_signups ss
    USING sessions s
    WHERE ss.user_id = v_user_id
      AND ss.session_id = s.id
      AND s.conference_id = v_target.conference_id
      AND s.id <> p_session_id
      -- Removability invariant: only swap out signups the user could still
      -- cancel themselves — window open, not checked in. Everything else is
      -- attendance/no-show history and survives the swap.
      AND now() < s.end_at + interval '60 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM session_check_ins ci
        WHERE ci.session_id = s.id AND ci.user_id = v_user_id
      )
      AND tstzrange(s.start_at, s.end_at) && tstzrange(v_target.start_at, v_target.end_at)
    RETURNING s.id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO v_replaced FROM overlapping;

  INSERT INTO session_signups (session_id, user_id) VALUES (p_session_id, v_user_id);

  RETURN jsonb_build_object('success', true, 'replaced_session_ids', v_replaced);
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_signup(p_session_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id UUID;
  v_end_at TIMESTAMPTZ;
  v_deleted INTEGER;
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- sessions.end_at is NOT NULL, so a NULL read means the row is gone.
  SELECT end_at INTO v_end_at FROM sessions WHERE id = p_session_id;
  IF v_end_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  -- Cancel window mirrors the sign-up window: open until end_at + grace.
  -- 60 minutes = GRACE_MINUTES in lib/checkInWindow.ts; change together.
  IF now() >= v_end_at + interval '60 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel after the check-in window has closed');
  END IF;

  -- Atomic removability guard: the NOT EXISTS rides inside the DELETE so a
  -- check-in committing concurrently can't slip between a separate check and
  -- the delete. A checked-in signup is attendance history — never removable.
  DELETE FROM session_signups ss
  WHERE ss.session_id = p_session_id
    AND ss.user_id = v_user_id
    AND NOT EXISTS (
      SELECT 1 FROM session_check_ins ci
      WHERE ci.session_id = p_session_id AND ci.user_id = v_user_id
    );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 AND EXISTS (
    SELECT 1 FROM session_check_ins
    WHERE session_id = p_session_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel after checking in');
  END IF;

  -- v_deleted = 0 without a check-in just means there was no signup row —
  -- cancelling twice is idempotent, not an error.
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_in_to_session(p_session_id uuid, p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
  v_inserted INTEGER;
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT check_in_code INTO v_code FROM sessions WHERE id = p_session_id;
  -- Case-insensitive match: codes are shared verbally / on signage, so a code
  -- printed 'AB12' must still validate when typed 'ab12' (mobile keyboards
  -- often don't auto-capitalize this field). Both sides are already trimmed
  -- client-side; lower() makes the comparison case-agnostic.
  IF v_code IS NULL OR lower(v_code) <> lower(p_code) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;

  INSERT INTO session_check_ins (session_id, user_id) VALUES (p_session_id, v_user_id)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'alreadyCheckedIn', v_inserted = 0);
END;
$$;

-- Admin-only cascade removal of an attendee from a conference.
CREATE OR REPLACE FUNCTION public.remove_attendee(p_conference_id uuid, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_caller UUID;
BEGIN
  v_caller := get_current_user_id();
  IF v_caller IS NULL OR NOT is_event_admin(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  DELETE FROM session_feedback  WHERE user_id = p_user_id AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM session_check_ins WHERE user_id = p_user_id AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM session_signups   WHERE user_id = p_user_id AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM conference_attendees WHERE conference_id = p_conference_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_conference(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_caller UUID;
  v_count INTEGER;
BEGIN
  v_caller := get_current_user_id();
  IF v_caller IS NULL OR NOT is_event_admin(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  SELECT count(*) INTO v_count FROM sessions WHERE conference_id = p_id;
  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Add at least one session before publishing');
  END IF;

  UPDATE conferences SET status = 'published', published_at = now() WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_auth_to_user();

CREATE TRIGGER update_users_updated_at               BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_regions_updated_at             BEFORE UPDATE ON regions             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subregions_updated_at          BEFORE UPDATE ON subregions          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_neighbor_nets_updated_at       BEFORE UPDATE ON neighbor_nets       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cabinet_departments_updated_at BEFORE UPDATE ON cabinet_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_cabinet_teams_updated_at       BEFORE UPDATE ON cabinet_teams       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_memberships_updated_at         BEFORE UPDATE ON memberships         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_role_assignments_updated_at    BEFORE UPDATE ON role_assignments    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_projects_updated_at       BEFORE UPDATE ON user_projects       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER conferences_set_updated_at            BEFORE UPDATE ON conferences         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sessions_set_updated_at               BEFORE UPDATE ON sessions            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER feedback_set_updated_at               BEFORE UPDATE ON session_feedback    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conferences_one_way_publish BEFORE UPDATE OF status   ON conferences FOR EACH ROW EXECUTE FUNCTION enforce_one_way_publish();
CREATE TRIGGER sessions_capacity_floor     BEFORE UPDATE OF capacity ON sessions    FOR EACH ROW EXECUTE FUNCTION enforce_capacity_floor();

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE subregions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbor_nets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships         ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_signups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_check_ins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs           ENABLE ROW LEVEL SECURITY;

-- users ----------------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Authenticated users can view all users" ON users FOR SELECT USING (is_authenticated());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());

-- geography (read-only to authenticated) -------------------------------------
CREATE POLICY "Authenticated users can view regions" ON regions FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view subregions" ON subregions FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view neighbor_nets" ON neighbor_nets FOR SELECT USING (is_authenticated());

-- cabinet (read-only to authenticated) ---------------------------------------
CREATE POLICY "Authenticated users can view cabinet_departments" ON cabinet_departments FOR SELECT USING (is_authenticated());
CREATE POLICY "Authenticated users can view cabinet_teams" ON cabinet_teams FOR SELECT USING (is_authenticated());

-- role_types (read-only to authenticated) ------------------------------------
CREATE POLICY "Authenticated users can view role_types" ON role_types FOR SELECT USING (is_authenticated());

-- memberships ----------------------------------------------------------------
CREATE POLICY "Users can view own memberships" ON memberships FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all memberships" ON memberships FOR SELECT USING (is_authenticated());
CREATE POLICY "Users can insert own memberships" ON memberships FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own memberships" ON memberships FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own memberships" ON memberships FOR DELETE USING (user_id = get_current_user_id());

-- role_assignments (users cannot self-grant a 'system'-category role) ---------
CREATE POLICY "Users can view own role_assignments" ON role_assignments FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all role_assignments" ON role_assignments FOR SELECT USING (is_authenticated());
CREATE POLICY "Users can insert own role_assignments" ON role_assignments FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND NOT EXISTS (SELECT 1 FROM role_types rt WHERE rt.id = role_assignments.role_type_id AND rt.category = 'system')
  );
CREATE POLICY "Users can update own role_assignments" ON role_assignments FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (
    user_id = get_current_user_id()
    AND NOT EXISTS (SELECT 1 FROM role_types rt WHERE rt.id = role_assignments.role_type_id AND rt.category = 'system')
  );
CREATE POLICY "Users can delete own role_assignments" ON role_assignments FOR DELETE USING (user_id = get_current_user_id());

-- user_projects --------------------------------------------------------------
CREATE POLICY "Users can view own projects" ON user_projects FOR SELECT USING (user_id = get_current_user_id());
CREATE POLICY "Authenticated users can view all projects" ON user_projects FOR SELECT USING (is_authenticated());
CREATE POLICY "Users can insert own projects" ON user_projects FOR INSERT WITH CHECK (user_id = get_current_user_id());
CREATE POLICY "Users can update own projects" ON user_projects FOR UPDATE USING (user_id = get_current_user_id());
CREATE POLICY "Users can delete own projects" ON user_projects FOR DELETE USING (user_id = get_current_user_id());

-- conferences ----------------------------------------------------------------
CREATE POLICY "Attendees can view their conferences" ON conferences FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM conference_attendees WHERE conference_id = conferences.id AND user_id = get_current_user_id())
    OR is_event_admin(get_current_user_id())
  );
CREATE POLICY "Admins can insert conferences" ON conferences FOR INSERT WITH CHECK (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can update conferences" ON conferences FOR UPDATE USING (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can delete conferences" ON conferences FOR DELETE USING (is_event_admin(get_current_user_id()));

-- conference_attendees -------------------------------------------------------
CREATE POLICY "Users can view own attendee row" ON conference_attendees FOR SELECT
  USING (user_id = get_current_user_id() OR is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can insert attendees" ON conference_attendees FOR INSERT WITH CHECK (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can update attendees" ON conference_attendees FOR UPDATE USING (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can delete attendees" ON conference_attendees FOR DELETE USING (is_event_admin(get_current_user_id()));

-- sessions -------------------------------------------------------------------
CREATE POLICY "Attendees can view sessions in their conferences" ON sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM conference_attendees WHERE conference_id = sessions.conference_id AND user_id = get_current_user_id())
    OR is_event_admin(get_current_user_id())
  );
CREATE POLICY "Admins can insert sessions" ON sessions FOR INSERT WITH CHECK (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can update sessions" ON sessions FOR UPDATE USING (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can delete sessions" ON sessions FOR DELETE USING (is_event_admin(get_current_user_id()));

-- session_signups ------------------------------------------------------------
CREATE POLICY "View signups for visible sessions" ON session_signups FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR is_event_admin(get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN conference_attendees ca ON ca.conference_id = s.conference_id AND ca.user_id = get_current_user_id()
      WHERE s.id = session_signups.session_id
    )
  );
CREATE POLICY "Admins can insert signups" ON session_signups FOR INSERT WITH CHECK (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can update signups" ON session_signups FOR UPDATE USING (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can delete signups" ON session_signups FOR DELETE USING (is_event_admin(get_current_user_id()));

-- session_check_ins ----------------------------------------------------------
CREATE POLICY "View own check-ins" ON session_check_ins FOR SELECT
  USING (user_id = get_current_user_id() OR is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can insert check-ins" ON session_check_ins FOR INSERT WITH CHECK (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can update check-ins" ON session_check_ins FOR UPDATE USING (is_event_admin(get_current_user_id()));
CREATE POLICY "Admins can delete check-ins" ON session_check_ins FOR DELETE USING (is_event_admin(get_current_user_id()));

-- session_feedback -----------------------------------------------------------
CREATE POLICY "View own feedback or admin" ON session_feedback FOR SELECT
  USING (user_id = get_current_user_id() OR is_event_admin(get_current_user_id()));
CREATE POLICY "Insert feedback after session ends" ON session_feedback FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND EXISTS (SELECT 1 FROM sessions s WHERE s.id = session_feedback.session_id AND s.end_at < now())
  );
CREATE POLICY "Update own feedback" ON session_feedback FOR UPDATE USING (user_id = get_current_user_id());

-- sync_logs ------------------------------------------------------------------
CREATE POLICY "admins can read sync_logs" ON sync_logs FOR SELECT USING (is_event_admin(get_current_user_id()));

-- ============================================================================
-- 7. REALTIME PUBLICATION
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE session_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE session_check_ins;
