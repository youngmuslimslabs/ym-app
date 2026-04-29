-- Migration: Conferences polish
-- Two unrelated hardening items for the conferences feature:
--   1. cancel_signup() now refuses to cancel after a session has started.
--      The UI already hides the Remove RSVP button at that point; this is
--      defense-in-depth for any client that calls the RPC directly.
--   2. conferences.timezone is now constrained to the US zones the admin
--      UI already restricts to. Direct SQL or future API consumers can no
--      longer write 'Europe/London' through the column.
-- ===============================================================

-- 1. cancel_signup time gate -------------------------------------

CREATE OR REPLACE FUNCTION cancel_signup(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_start_at TIMESTAMPTZ;
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT start_at INTO v_start_at FROM sessions WHERE id = p_session_id;
  IF v_start_at IS NOT NULL AND v_start_at <= now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot cancel after a session has started'
    );
  END IF;

  DELETE FROM session_signups
    WHERE session_id = p_session_id AND user_id = v_user_id;
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. US-only timezone CHECK constraint ---------------------------
-- Mirrors src/app/(app)/admin/conferences/lib/timezones.ts.
-- Add new zones in BOTH places.

ALTER TABLE conferences
  ADD CONSTRAINT conferences_us_timezone_check
  CHECK (timezone IN (
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles'
  ));
