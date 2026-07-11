-- Grace-tail RSVP (PR #70 follow-up; code-review findings 1 & 2).
--
-- The app now offers Sign up until end_at + 15 minutes (GRACE_MINUTES in
-- src/app/(app)/conferences/[conferenceId]/lib/checkInWindow.ts — keep the
-- interval below in sync). Two RPCs assumed sign-up could never happen after a
-- session ended and need their guards adjusted:
--
-- 1. signup_for_session: the overlap-swap DELETE must never remove the signup
--    of a session that has already ended — those rows are attendance history
--    (cancel_signup refuses to touch them; the swap must not either). A
--    grace-tail signup now leaves finished overlaps intact.
-- 2. cancel_signup: removal mirrors creation. Allow cancels until the sign-up
--    window closes (end_at + grace) as the escape hatch for a mistapped
--    grace-tail signup, but never after the attendee checked in. Mid-session
--    cancels become possible server-side; the UI still only offers Remove RSVP
--    before start and during the grace tail (canRemoveSignUp).

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
      -- Never swap out an already-ended session: that signup is attendance
      -- history, and a grace-tail signup would otherwise silently erase it.
      AND s.end_at > now()
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
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Cancel window mirrors the sign-up window: open until end_at + grace.
  -- 15 minutes = GRACE_MINUTES in lib/checkInWindow.ts; keep in sync.
  SELECT end_at INTO v_end_at FROM sessions WHERE id = p_session_id;
  IF v_end_at IS NOT NULL AND now() >= v_end_at + interval '15 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel after the check-in window has closed');
  END IF;

  -- A checked-in attendee's signup is attendance history — never removable.
  IF EXISTS (
    SELECT 1 FROM session_check_ins
    WHERE session_id = p_session_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot cancel after checking in');
  END IF;

  DELETE FROM session_signups WHERE session_id = p_session_id AND user_id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
