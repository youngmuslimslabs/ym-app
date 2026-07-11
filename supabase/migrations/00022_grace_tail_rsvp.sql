-- Grace-tail RSVP (PR #70 follow-up; code-review findings, two rounds).
--
-- The app offers Sign up until end_at + 15 minutes (GRACE_MINUTES in
-- src/app/(app)/conferences/[conferenceId]/lib/checkInWindow.ts — change the
-- intervals below together with it). That loosening means the signup RPCs can
-- no longer assume sign-up happens only before a session ends. Both functions
-- now enforce ONE removability invariant:
--
--   A signup row is removable — by the owner's cancel OR by the overlap swap —
--   iff its session's sign-up window (end_at + grace) is still open AND the
--   user has not checked in. Checked-in rows and rows whose window has closed
--   are attendance/no-show history: only remove_attendee (admin) touches them.
--
-- Deliberate consequence, documented: a non-checked-in attendee CAN cancel
-- mid-session server-side (the window is open). The UI only offers Remove RSVP
-- before start and during the grace tail (canRemoveSignUp); the looser server
-- bound follows the app-layer-enforcement decision from #67 and keeps the
-- grace-tail escape hatch (mistapped signup) working.

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
  -- permanently uncancellable under the invariant above.
  IF now() >= v_target.end_at + interval '15 minutes' THEN
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
      AND now() < s.end_at + interval '15 minutes'
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
  -- 15 minutes = GRACE_MINUTES in lib/checkInWindow.ts; change together.
  IF now() >= v_end_at + interval '15 minutes' THEN
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
