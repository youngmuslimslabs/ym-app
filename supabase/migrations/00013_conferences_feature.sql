-- Migration: Conferences feature
-- Tables, triggers, indexes, role insert, functions, RLS, realtime.
-- See docs/plans/2026-04-25-conference-staged-build.md (Stage 0).
-- ===============================================================

-- ============================================
-- 1. ENUM
-- ============================================

CREATE TYPE conference_status AS ENUM ('draft', 'published');

-- ============================================
-- 2. CONFERENCES TABLE + ONE-WAY PUBLISH TRIGGER
-- ============================================

CREATE TABLE conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status conference_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date),
  CHECK ((status = 'published') = (published_at IS NOT NULL))
);

CREATE OR REPLACE FUNCTION enforce_one_way_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' AND NEW.status = 'draft' THEN
    RAISE EXCEPTION 'Cannot unpublish a conference. Delete it instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conferences_one_way_publish
  BEFORE UPDATE OF status ON conferences
  FOR EACH ROW EXECUTE FUNCTION enforce_one_way_publish();

-- ============================================
-- 3. CONFERENCE_ATTENDEES JUNCTION
-- ============================================

CREATE TABLE conference_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (conference_id, user_id)
);

-- ============================================
-- 4. SESSIONS TABLE (TIMESTAMPTZ, not date+time)
-- ============================================

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

-- ============================================
-- 5. SIGNUPS / CHECK-INS / FEEDBACK
-- ============================================

CREATE TABLE session_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

CREATE TABLE session_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (session_id, user_id)
);

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

-- ============================================
-- 6. INDEXES
-- ============================================

CREATE INDEX idx_sessions_conference_start ON sessions(conference_id, start_at);
CREATE INDEX idx_signups_session ON session_signups(session_id);
CREATE INDEX idx_signups_user ON session_signups(user_id);
CREATE INDEX idx_checkins_session ON session_check_ins(session_id);
CREATE INDEX idx_feedback_session ON session_feedback(session_id);
CREATE INDEX idx_conf_attendees_user ON conference_attendees(user_id);

-- ============================================
-- 7. CAPACITY-FLOOR TRIGGER
-- Block reducing capacity below current signup count.
-- ============================================

CREATE OR REPLACE FUNCTION enforce_capacity_floor()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF NEW.capacity IS NOT NULL
     AND (OLD.capacity IS NULL OR NEW.capacity < OLD.capacity) THEN
    SELECT count(*) INTO current_count
      FROM session_signups WHERE session_id = NEW.id;
    IF NEW.capacity < current_count THEN
      RAISE EXCEPTION
        'Cannot reduce capacity below current signup count (%).', current_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_capacity_floor
  BEFORE UPDATE OF capacity ON sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_capacity_floor();

-- ============================================
-- 8. UPDATED_AT TRIGGERS (reuse existing update_updated_at())
-- ============================================

CREATE TRIGGER conferences_set_updated_at
  BEFORE UPDATE ON conferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER feedback_set_updated_at
  BEFORE UPDATE ON session_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. EVENT_ADMIN ROLE
-- The 'system' enum value was added in 00012.
-- ============================================

INSERT INTO role_types (name, code, category, scope_type, max_per_scope, description, sort_order)
VALUES ('Event Admin', 'event_admin', 'system', 'national', NULL,
        'Can create and manage conferences, sessions, rosters', 100)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 10. FUNCTIONS
-- All SECURITY DEFINER, search_path = public.
-- ============================================

CREATE OR REPLACE FUNCTION is_event_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_assignments ra
    JOIN role_types rt ON ra.role_type_id = rt.id
    WHERE ra.user_id = p_user_id
      AND rt.code = 'event_admin'
      AND ra.is_active
      AND (ra.end_date IS NULL OR ra.end_date >= CURRENT_DATE)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- signup_for_session: validates, locks the session row, deletes overlapping
-- signups by the same user (range overlap), then inserts. Returns the list
-- of session ids that were swapped out so the UI can toast "Switched from X".
CREATE OR REPLACE FUNCTION signup_for_session(p_session_id UUID)
RETURNS JSONB AS $$
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

  SELECT status INTO v_conf_status
    FROM conferences WHERE id = v_target.conference_id;
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
    SELECT 1 FROM session_signups
    WHERE session_id = p_session_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'replaced_session_ids', ARRAY[]::UUID[]);
  END IF;

  IF v_target.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_current_count
      FROM session_signups WHERE session_id = p_session_id;
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
      AND tstzrange(s.start_at, s.end_at) && tstzrange(v_target.start_at, v_target.end_at)
    RETURNING s.id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO v_replaced FROM overlapping;

  INSERT INTO session_signups (session_id, user_id)
  VALUES (p_session_id, v_user_id);

  RETURN jsonb_build_object('success', true, 'replaced_session_ids', v_replaced);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- cancel_signup: idempotent removal of own signup.
CREATE OR REPLACE FUNCTION cancel_signup(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  DELETE FROM session_signups
    WHERE session_id = p_session_id AND user_id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- check_in_to_session: verifies code, idempotent insert.
CREATE OR REPLACE FUNCTION check_in_to_session(p_session_id UUID, p_code TEXT)
RETURNS JSONB AS $$
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
  IF v_code IS NULL OR v_code <> p_code THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;

  INSERT INTO session_check_ins (session_id, user_id)
  VALUES (p_session_id, v_user_id)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'alreadyCheckedIn', v_inserted = 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- remove_attendee: admin-only cascade. Deletes feedback, check-ins, signups
-- for the user's sessions in this conference, then the junction row.
CREATE OR REPLACE FUNCTION remove_attendee(p_conference_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_caller UUID;
BEGIN
  v_caller := get_current_user_id();
  IF v_caller IS NULL OR NOT is_event_admin(v_caller) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  DELETE FROM session_feedback
    WHERE user_id = p_user_id
      AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM session_check_ins
    WHERE user_id = p_user_id
      AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM session_signups
    WHERE user_id = p_user_id
      AND session_id IN (SELECT id FROM sessions WHERE conference_id = p_conference_id);
  DELETE FROM conference_attendees
    WHERE conference_id = p_conference_id AND user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- publish_conference: admin-only; rejects if no sessions exist.
CREATE OR REPLACE FUNCTION publish_conference(p_id UUID)
RETURNS JSONB AS $$
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

  UPDATE conferences
     SET status = 'published', published_at = now()
   WHERE id = p_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 11. RLS POLICIES
-- ============================================

ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;

-- conferences ---------------------------------------------------------------

CREATE POLICY "Attendees can view their conferences"
  ON conferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conference_attendees
      WHERE conference_id = conferences.id
        AND user_id = get_current_user_id()
    )
    OR is_event_admin(get_current_user_id())
  );

CREATE POLICY "Admins can insert conferences"
  ON conferences FOR INSERT
  WITH CHECK (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can update conferences"
  ON conferences FOR UPDATE
  USING (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can delete conferences"
  ON conferences FOR DELETE
  USING (is_event_admin(get_current_user_id()));

-- conference_attendees ------------------------------------------------------

CREATE POLICY "Users can view own attendee row"
  ON conference_attendees FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR is_event_admin(get_current_user_id())
  );

CREATE POLICY "Admins can insert attendees"
  ON conference_attendees FOR INSERT
  WITH CHECK (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can update attendees"
  ON conference_attendees FOR UPDATE
  USING (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can delete attendees"
  ON conference_attendees FOR DELETE
  USING (is_event_admin(get_current_user_id()));

-- sessions ------------------------------------------------------------------

CREATE POLICY "Attendees can view sessions in their conferences"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conference_attendees
      WHERE conference_id = sessions.conference_id
        AND user_id = get_current_user_id()
    )
    OR is_event_admin(get_current_user_id())
  );

CREATE POLICY "Admins can insert sessions"
  ON sessions FOR INSERT
  WITH CHECK (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can update sessions"
  ON sessions FOR UPDATE
  USING (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can delete sessions"
  ON sessions FOR DELETE
  USING (is_event_admin(get_current_user_id()));

-- session_signups -----------------------------------------------------------
-- Reads: own row OR any signup row for sessions in conferences the user
-- attends (so we can show seat counts). Admins read all.
-- Writes happen via signup_for_session() / cancel_signup() (SECURITY DEFINER).
-- Direct writes are admin-only.

CREATE POLICY "View signups for visible sessions"
  ON session_signups FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR is_event_admin(get_current_user_id())
    OR EXISTS (
      SELECT 1 FROM sessions s
      JOIN conference_attendees ca
        ON ca.conference_id = s.conference_id
       AND ca.user_id = get_current_user_id()
      WHERE s.id = session_signups.session_id
    )
  );

CREATE POLICY "Admins can insert signups"
  ON session_signups FOR INSERT
  WITH CHECK (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can update signups"
  ON session_signups FOR UPDATE
  USING (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can delete signups"
  ON session_signups FOR DELETE
  USING (is_event_admin(get_current_user_id()));

-- session_check_ins ---------------------------------------------------------

CREATE POLICY "View own check-ins"
  ON session_check_ins FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR is_event_admin(get_current_user_id())
  );

CREATE POLICY "Admins can insert check-ins"
  ON session_check_ins FOR INSERT
  WITH CHECK (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can update check-ins"
  ON session_check_ins FOR UPDATE
  USING (is_event_admin(get_current_user_id()));

CREATE POLICY "Admins can delete check-ins"
  ON session_check_ins FOR DELETE
  USING (is_event_admin(get_current_user_id()));

-- session_feedback ----------------------------------------------------------
-- INSERT: only after the session has ended (end_at < NOW()).
-- UPDATE: own row only, no time gate (the 24h window is a UI suggestion).
-- DELETE: no policy. Feedback is permanent.

CREATE POLICY "View own feedback or admin"
  ON session_feedback FOR SELECT
  USING (
    user_id = get_current_user_id()
    OR is_event_admin(get_current_user_id())
  );

CREATE POLICY "Insert feedback after session ends"
  ON session_feedback FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_feedback.session_id
        AND s.end_at < now()
    )
  );

CREATE POLICY "Update own feedback"
  ON session_feedback FOR UPDATE
  USING (user_id = get_current_user_id());

-- ============================================
-- 12. REALTIME PUBLICATION
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE session_signups;
ALTER PUBLICATION supabase_realtime ADD TABLE session_check_ins;
