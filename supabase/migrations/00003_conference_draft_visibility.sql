-- ============================================================================
-- 00003_conference_draft_visibility.sql
-- ============================================================================
-- Draft conferences were not actually hidden from attendees. The two
-- attendee-facing SELECT policies in the baseline gated only on
-- conference_attendees membership, with NO status check:
--
--   "Attendees can view their conferences"        (conferences)
--   "Attendees can view sessions in their conferences" (sessions)
--
-- So any user with a conference_attendees row could read a conference and its
-- full schedule even while status = 'draft'. `draft` only ever blocked *signup*
-- (the signup_for_session RPC checks published); it never blocked *visibility*.
-- The attendee data loader (conferences/[conferenceId]/data.ts) also selects by
-- id with no status filter and relies entirely on RLS, so RLS is the right place
-- to fix it (defense-in-depth, independent of any single query).
--
-- Fix: an attendee may see a conference / its sessions only when it is
-- published. Admins (is_event_admin) still see everything, including drafts, so
-- the admin editor and pre-publish preview are unaffected.
--
-- Result: a conference can be seeded with its full roster while still in draft
-- and remain invisible to those attendees until it is published — publishing
-- becomes a single status flip.
--
-- Not changed (intentionally, out of scope for "visibility of the schedule"):
--   * conference_attendees "view own attendee row" — exposes only the fact of
--     membership (a user_id/conference_id link), not schedule content, and the
--     conference row itself is now gated above.
--   * session_signups / session_check_ins / session_feedback — user-owned rows;
--     none can exist for a draft (signup is blocked pre-publish).
-- ============================================================================

BEGIN;

-- conferences: attendees only see PUBLISHED conferences they belong to.
DROP POLICY IF EXISTS "Attendees can view their conferences" ON conferences;
CREATE POLICY "Attendees can view their conferences" ON conferences FOR SELECT
  USING (
    is_event_admin(get_current_user_id())
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1 FROM conference_attendees
        WHERE conference_id = conferences.id
          AND user_id = get_current_user_id()
      )
    )
  );

-- sessions: same rule, but status lives on the parent conference, so join to it.
DROP POLICY IF EXISTS "Attendees can view sessions in their conferences" ON sessions;
CREATE POLICY "Attendees can view sessions in their conferences" ON sessions FOR SELECT
  USING (
    is_event_admin(get_current_user_id())
    OR EXISTS (
      SELECT 1
      FROM conference_attendees ca
      JOIN conferences c ON c.id = ca.conference_id
      WHERE ca.conference_id = sessions.conference_id
        AND ca.user_id = get_current_user_id()
        AND c.status = 'published'
    )
  );

COMMIT;
