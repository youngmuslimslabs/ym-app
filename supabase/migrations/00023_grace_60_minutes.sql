-- Widen the check-in / RSVP grace tail from 15 minutes to 60 minutes.
--
-- The app-layer constant is GRACE_MINUTES in
-- src/app/(app)/conferences/[conferenceId]/lib/checkInWindow.ts; the same three
-- server-side `interval` bounds live in signup_for_session and cancel_signup
-- (originally 00022_grace_tail_rsvp.sql, also mirrored in the consolidated
-- baseline 00001_initial_schema.sql). Change all three together.
--
-- The removability invariant and error surface are unchanged — this only
-- lengthens the tail an attendee has to sign up / check in / cancel after a
-- session's end_at.

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

  SELECT end_at INTO v_end_at FROM sessions WHERE id = p_session_id;
  IF v_end_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF now() >= v_end_at + interval '60 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel after the check-in window has closed');
  END IF;

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

  RETURN jsonb_build_object('success', true);
END;
$$;
