-- Conference feature smoke test (Stage 0 regression suite)
-- Run with:  psql "$SUPABASE_DB_URL" -f supabase/seed/conference-smoke-test.sql
--
-- Prerequisites:
--   1. Migrations 00012 and 00013 applied.
--   2. A user exists with email an.omar.ees@gmail.com AND has logged in
--      (so auth_id is set).
--   3. That user has the event_admin role active (Task 0.5 in the plan).
--
-- The script wraps everything in BEGIN ... ROLLBACK so no rows persist.
-- Each step prints a NOTICE describing what happened. Expected outputs are
-- documented inline in comments next to each step.
--
-- The script switches to the `authenticated` role so RLS policies actually
-- fire (the postgres superuser bypasses RLS).

\set ON_ERROR_STOP on

BEGIN;

DO $smoke$
DECLARE
  v_user_id     UUID;
  v_auth_id     UUID;
  v_conf_id     UUID;
  v_session_a   UUID;
  v_session_b   UUID;
  v_break_id    UUID;
  v_result      JSONB;
  v_count       INTEGER;
  v_inserted_id UUID;
BEGIN
  -- ============================================================
  -- Setup: look up Omar and impersonate him via JWT claim.
  -- ============================================================
  SELECT id, auth_id INTO v_user_id, v_auth_id
    FROM users WHERE email = 'an.omar.ees@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Test user an.omar.ees@gmail.com not found. Create the user first.';
  END IF;
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Test user has not logged in yet (auth_id is NULL). Sign in once with Google, then re-run.';
  END IF;
  IF NOT is_event_admin(v_user_id) THEN
    RAISE EXCEPTION 'Test user is not an event_admin. Run Task 0.5 first.';
  END IF;

  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', v_auth_id::text)::text,
    true
  );
  PERFORM set_config('request.jwt.claim.sub', v_auth_id::text, true);

  RAISE NOTICE '[setup] Impersonating % (auth_id=%)', v_user_id, v_auth_id;

  -- ============================================================
  -- Step 1: insert a draft conference.
  -- Expected: row inserted.
  -- ============================================================
  INSERT INTO conferences (name, description, location, timezone, start_date, end_date)
  VALUES ('SMOKE TEST CONF', 'Stage 0 smoke test', 'Remote', 'America/New_York',
          CURRENT_DATE, CURRENT_DATE + 1)
  RETURNING id INTO v_conf_id;
  RAISE NOTICE '[01] PASS: conference created id=%', v_conf_id;

  -- ============================================================
  -- Step 2: publish_conference() with no sessions.
  -- Expected: {success:false, error:'Add at least one session before publishing'}
  -- ============================================================
  v_result := publish_conference(v_conf_id);
  IF (v_result->>'success')::boolean = false
     AND v_result->>'error' = 'Add at least one session before publishing' THEN
    RAISE NOTICE '[02] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[02] FAIL: expected publish to reject zero-session conference, got %', v_result;
  END IF;

  -- ============================================================
  -- Step 3: insert two parallel sessions + a break.
  -- ============================================================
  INSERT INTO sessions (conference_id, start_at, end_at, title, capacity, check_in_code)
  VALUES (v_conf_id,
          (CURRENT_DATE + TIME '09:00') AT TIME ZONE 'America/New_York',
          (CURRENT_DATE + TIME '10:15') AT TIME ZONE 'America/New_York',
          'Session A', 30, 'AAAA')
  RETURNING id INTO v_session_a;

  INSERT INTO sessions (conference_id, start_at, end_at, title, capacity, check_in_code)
  VALUES (v_conf_id,
          (CURRENT_DATE + TIME '09:00') AT TIME ZONE 'America/New_York',
          (CURRENT_DATE + TIME '10:15') AT TIME ZONE 'America/New_York',
          'Session B', 30, 'BBBB')
  RETURNING id INTO v_session_b;

  INSERT INTO sessions (conference_id, start_at, end_at, title, is_break)
  VALUES (v_conf_id,
          (CURRENT_DATE + TIME '10:15') AT TIME ZONE 'America/New_York',
          (CURRENT_DATE + TIME '10:30') AT TIME ZONE 'America/New_York',
          'Coffee break', true)
  RETURNING id INTO v_break_id;
  RAISE NOTICE '[03] PASS: 2 parallel sessions + 1 break inserted';

  -- ============================================================
  -- Step 4: add Omar as conference attendee.
  -- ============================================================
  INSERT INTO conference_attendees (conference_id, user_id) VALUES (v_conf_id, v_user_id);
  RAISE NOTICE '[04] PASS: attendee added';

  -- ============================================================
  -- Step 5: publish_conference() now succeeds.
  -- Expected: {success:true}
  -- ============================================================
  v_result := publish_conference(v_conf_id);
  IF (v_result->>'success')::boolean = true THEN
    RAISE NOTICE '[05] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[05] FAIL: %', v_result;
  END IF;

  -- ============================================================
  -- Step 6: signup_for_session(session_a).
  -- Expected: {success:true, replaced_session_ids:[]}
  -- ============================================================
  v_result := signup_for_session(v_session_a);
  IF (v_result->>'success')::boolean = true
     AND jsonb_array_length(v_result->'replaced_session_ids') = 0 THEN
    RAISE NOTICE '[06] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[06] FAIL: %', v_result;
  END IF;

  -- ============================================================
  -- Step 7: signup_for_session(session_b) — overlaps with A.
  -- Expected: {success:true, replaced_session_ids:[<session_a>]}
  -- ============================================================
  v_result := signup_for_session(v_session_b);
  IF (v_result->>'success')::boolean = true
     AND v_result->'replaced_session_ids' @> jsonb_build_array(v_session_a::text) THEN
    RAISE NOTICE '[07] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[07] FAIL: expected replaced_session_ids to contain %, got %',
      v_session_a, v_result;
  END IF;

  -- ============================================================
  -- Step 8: cancel_signup(session_b).
  -- Expected: {success:true} and signup row gone.
  -- ============================================================
  v_result := cancel_signup(v_session_b);
  SELECT count(*) INTO v_count
    FROM session_signups WHERE session_id = v_session_b AND user_id = v_user_id;
  IF (v_result->>'success')::boolean = true AND v_count = 0 THEN
    RAISE NOTICE '[08] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[08] FAIL: result=% remaining_signups=%', v_result, v_count;
  END IF;

  -- Re-sign up so we have a body to test the capacity floor against.
  PERFORM signup_for_session(v_session_a);

  -- ============================================================
  -- Step 9: try to UPDATE capacity to 0 with a signup present.
  -- Expected: EXCEPTION from enforce_capacity_floor trigger.
  -- ============================================================
  BEGIN
    UPDATE sessions SET capacity = 0 WHERE id = v_session_a;
    RAISE EXCEPTION '[09] FAIL: capacity reduction below signup count should have raised';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM LIKE '%[09] FAIL%' THEN RAISE; END IF;
      RAISE NOTICE '[09] PASS: %', SQLERRM;
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot reduce capacity%' THEN
        RAISE NOTICE '[09] PASS: %', SQLERRM;
      ELSE
        RAISE EXCEPTION '[09] FAIL: unexpected error: %', SQLERRM;
      END IF;
  END;

  -- ============================================================
  -- Step 10: check_in_to_session — wrong code, then correct (case-insensitive),
  -- then again. Session A's stored code is 'AAAA'; 10b checks in with lowercase
  -- 'aaaa' to prove the match is case-insensitive, 10c uses 'AAAA' to prove both
  -- casings resolve to the same check-in.
  -- Expected: {success:false}, {success:true,alreadyCheckedIn:false}, {success:true,alreadyCheckedIn:true}
  -- ============================================================
  v_result := check_in_to_session(v_session_a, 'WRONG');
  IF (v_result->>'success')::boolean = false AND v_result->>'error' = 'Invalid code' THEN
    RAISE NOTICE '[10a] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[10a] FAIL: %', v_result;
  END IF;

  -- Lowercase against a stored 'AAAA' — must still succeed (case-insensitive).
  v_result := check_in_to_session(v_session_a, 'aaaa');
  IF (v_result->>'success')::boolean = true
     AND (v_result->>'alreadyCheckedIn')::boolean = false THEN
    RAISE NOTICE '[10b] PASS (case-insensitive): %', v_result;
  ELSE
    RAISE EXCEPTION '[10b] FAIL: %', v_result;
  END IF;

  v_result := check_in_to_session(v_session_a, 'AAAA');
  IF (v_result->>'success')::boolean = true
     AND (v_result->>'alreadyCheckedIn')::boolean = true THEN
    RAISE NOTICE '[10c] PASS: %', v_result;
  ELSE
    RAISE EXCEPTION '[10c] FAIL: %', v_result;
  END IF;

  -- ============================================================
  -- Step 11: INSERT into session_feedback while session is in the future.
  -- Expected: RLS rejects (session A's end_at is today, possibly past;
  -- so use session_b which we'll force into the future first).
  -- ============================================================
  UPDATE sessions SET start_at = now() + INTERVAL '1 hour',
                      end_at   = now() + INTERVAL '2 hours'
   WHERE id = v_session_b;

  BEGIN
    INSERT INTO session_feedback (session_id, user_id, rating, comment)
    VALUES (v_session_b, v_user_id, 5, 'Too early!');
    RAISE EXCEPTION '[11] FAIL: feedback insert before session end should have been rejected by RLS';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM LIKE '%[11] FAIL%' THEN RAISE; END IF;
      RAISE NOTICE '[11] PASS: %', SQLERRM;
    WHEN insufficient_privilege THEN
      RAISE NOTICE '[11] PASS: insufficient_privilege (RLS rejected): %', SQLERRM;
    WHEN check_violation THEN
      RAISE NOTICE '[11] PASS: check_violation (RLS WITH CHECK rejected): %', SQLERRM;
    WHEN OTHERS THEN
      -- Supabase reports RLS rejections as "new row violates row-level security policy".
      IF SQLERRM LIKE '%row-level security%' OR SQLERRM LIKE '%violates row-level%' THEN
        RAISE NOTICE '[11] PASS: %', SQLERRM;
      ELSE
        RAISE EXCEPTION '[11] FAIL: unexpected error: %', SQLERRM;
      END IF;
  END;

  -- ============================================================
  -- Step 12: end_at moved to past, INSERT feedback succeeds.
  -- ============================================================
  UPDATE sessions SET start_at = now() - INTERVAL '2 hours',
                      end_at   = now() - INTERVAL '1 hour'
   WHERE id = v_session_b;

  INSERT INTO session_feedback (session_id, user_id, rating, comment)
  VALUES (v_session_b, v_user_id, 4, 'Good session')
  RETURNING id INTO v_inserted_id;
  IF v_inserted_id IS NOT NULL THEN
    RAISE NOTICE '[12] PASS: feedback inserted id=%', v_inserted_id;
  ELSE
    RAISE EXCEPTION '[12] FAIL: feedback INSERT did not return id';
  END IF;

  -- ============================================================
  -- Step 13: remove_attendee — cascades through feedback, check-ins, signups.
  -- ============================================================
  v_result := remove_attendee(v_conf_id, v_user_id);
  SELECT
    (SELECT count(*) FROM session_feedback WHERE user_id = v_user_id
       AND session_id IN (SELECT id FROM sessions WHERE conference_id = v_conf_id))
    + (SELECT count(*) FROM session_check_ins WHERE user_id = v_user_id
       AND session_id IN (SELECT id FROM sessions WHERE conference_id = v_conf_id))
    + (SELECT count(*) FROM session_signups WHERE user_id = v_user_id
       AND session_id IN (SELECT id FROM sessions WHERE conference_id = v_conf_id))
    + (SELECT count(*) FROM conference_attendees
       WHERE conference_id = v_conf_id AND user_id = v_user_id)
  INTO v_count;
  IF (v_result->>'success')::boolean = true AND v_count = 0 THEN
    RAISE NOTICE '[13] PASS: % (all attendee data removed)', v_result;
  ELSE
    RAISE EXCEPTION '[13] FAIL: result=% remaining=%', v_result, v_count;
  END IF;

  -- ============================================================
  -- Step 14: try to UPDATE conference status from published back to draft.
  -- Expected: EXCEPTION from enforce_one_way_publish trigger.
  -- ============================================================
  BEGIN
    UPDATE conferences SET status = 'draft' WHERE id = v_conf_id;
    RAISE EXCEPTION '[14] FAIL: unpublishing should have been blocked';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM LIKE '%[14] FAIL%' THEN RAISE; END IF;
      RAISE NOTICE '[14] PASS: %', SQLERRM;
    WHEN OTHERS THEN
      IF SQLERRM LIKE '%Cannot unpublish%' THEN
        RAISE NOTICE '[14] PASS: %', SQLERRM;
      ELSE
        RAISE EXCEPTION '[14] FAIL: unexpected error: %', SQLERRM;
      END IF;
  END;

  -- ============================================================
  -- Step 15: DELETE conference, expect cascade to clean everything up.
  -- ============================================================
  DELETE FROM conferences WHERE id = v_conf_id;
  SELECT
    (SELECT count(*) FROM sessions WHERE conference_id = v_conf_id)
    + (SELECT count(*) FROM conference_attendees WHERE conference_id = v_conf_id)
  INTO v_count;
  IF v_count = 0 THEN
    RAISE NOTICE '[15] PASS: cascade removed all child rows';
  ELSE
    RAISE EXCEPTION '[15] FAIL: % child rows remain', v_count;
  END IF;

  RAISE NOTICE '=== SMOKE TEST: ALL STEPS PASSED ===';
END
$smoke$;

ROLLBACK;
