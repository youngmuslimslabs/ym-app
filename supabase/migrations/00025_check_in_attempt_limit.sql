-- ============================================================================
-- 00025_check_in_attempt_limit.sql
-- ============================================================================
-- Issue #73 (Conferences: check-in limitations).
--
-- Check-in codes are short and admin-chosen (e.g. 'AB12'), and nothing limited
-- how many a member could try, so a code could be guessed by brute force.
-- This migration:
--
--   1. Records each FAILED check-in attempt per member per session.
--   2. Locks a member out of that one session's check-in after
--      5 failures in 10 minutes. The response carries retryAfterSeconds so the
--      app can say when to try again. Other sessions are unaffected.
--   3. Rejects codes longer than the 15 characters an admin can set
--      (SessionPanel caps the field at 15). They can never match, and are
--      counted as a failed attempt.
--   4. Treats a NULL code as wrong. Before this, `lower(v_code) <> lower(NULL)`
--      evaluated to NULL, the IF was skipped, and the call checked the member
--      in with no code at all.
--   5. Trims both sides before the (already) case-insensitive comparison.
--   6. Takes a per-member, per-session advisory lock before counting, so
--      concurrent calls can't all read the count before any failure is written
--      and slip past the cap.
--
-- Successful and repeat check-ins are not recorded. Attempts are only written
-- by this SECURITY DEFINER function; RLS is on with no policies, so members
-- cannot read or clear their own attempts.
--
-- Keep CHECK_IN_CODE_MAX_LENGTH, CHECK_IN_MAX_FAILURES and
-- CHECK_IN_LOCKOUT_MINUTES in src/lib/check-in-code.ts in step with this file.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_check_in_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_check_in_attempts_lookup
  ON public.session_check_in_attempts (user_id, session_id, attempted_at);

ALTER TABLE public.session_check_in_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_check_in_attempts FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_in_to_session(p_session_id uuid, p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_user_id UUID;
  v_code TEXT;
  v_session_found BOOLEAN;
  v_failures INTEGER;
  v_oldest_failure TIMESTAMPTZ;
  v_inserted INTEGER;
BEGIN
  v_user_id := get_current_user_id();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Serialize attempts per member per session so a parallel burst can't all
  -- read the count before any failure is recorded. Released automatically at
  -- the end of the transaction.
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_session_id::text));

  SELECT count(*), min(attempted_at) INTO v_failures, v_oldest_failure
  FROM session_check_in_attempts
  WHERE user_id = v_user_id
    AND session_id = p_session_id
    AND attempted_at > now() - interval '10 minutes';

  IF v_failures >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Too many attempts',
      'retryAfterSeconds',
        greatest(1, ceil(extract(epoch FROM v_oldest_failure + interval '10 minutes' - now()))::int)
    );
  END IF;

  SELECT check_in_code INTO v_code FROM sessions WHERE id = p_session_id;
  v_session_found := FOUND;

  -- Case-insensitive match: codes are shared verbally / on signage, so a code
  -- printed 'AB12' must still validate when typed 'ab12' (mobile keyboards
  -- often don't auto-capitalize this field).
  IF v_code IS NULL
     OR p_code IS NULL
     OR char_length(p_code) > 15
     OR lower(btrim(v_code)) <> lower(btrim(p_code)) THEN
    IF v_session_found THEN
      INSERT INTO session_check_in_attempts (session_id, user_id)
      VALUES (p_session_id, v_user_id);
      -- The failure that uses up the last attempt reports the lockout right
      -- away, so the member isn't invited to type a 6th code.
      IF v_failures + 1 >= 5 THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Too many attempts',
          'retryAfterSeconds',
            greatest(1, ceil(extract(epoch FROM coalesce(v_oldest_failure, now()) + interval '10 minutes' - now()))::int)
        );
      END IF;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid code');
  END IF;

  INSERT INTO session_check_ins (session_id, user_id) VALUES (p_session_id, v_user_id)
  ON CONFLICT (session_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN jsonb_build_object('success', true, 'alreadyCheckedIn', v_inserted = 0);
END;
$$;
