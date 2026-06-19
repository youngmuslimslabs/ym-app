-- Migration: Restrict self-assignment of system-category roles
-- =====================================================================
-- Closes a privilege-escalation hole in the role_assignments policies.
--
-- Before: the INSERT policy only checked `user_id = get_current_user_id()`,
-- so any authenticated user could insert a row with
-- role_type_id = the 'event_admin' system role and immediately pass
-- is_event_admin() / requireAdmin() — gaining full conference admin.
-- The UPDATE policy additionally had no WITH CHECK, so an existing
-- assignment could be repointed at a system role to the same effect.
--
-- After: a user may only insert/update their own role_assignments AND only
-- for non-system role_types. System-category roles (currently just
-- 'event_admin', added in 00012/00013) are granted exclusively via
-- service-role tooling, never through the Data API. Every legitimate
-- onboarding/profile role is a non-system category, so normal use is
-- unaffected.
--
-- Safety of the subquery (verified against the PostgreSQL RLS docs):
-- policy expressions run with the privileges of the *calling* user, so this
-- NOT EXISTS is itself subject to role_types' RLS. It does NOT fail open
-- only because role_types has a permissive "Authenticated users can view
-- role_types" SELECT policy (00006:89-91), so the event_admin row is visible
-- to every authenticated caller (visible row -> NOT EXISTS is false -> the
-- WITH CHECK rejects the write).
-- WARNING: if role_types SELECT is ever restricted so a user cannot see the
-- system row, this check would fail OPEN. If that changes, switch to a
-- SECURITY DEFINER helper that reads role_types regardless of RLS.
--
-- TODO(test): RLS can only be exercised against a live DB, so there is no
-- automated regression test here yet. Add a pgTAP/integration test asserting
-- a non-admin INSERT/UPDATE of an event_admin role_assignment is rejected and
-- that a non-system role still succeeds. Tracked as P0 #9 / P1 #12 in
-- docs/project-todos.md.
-- =====================================================================

-- INSERT: own row, and the role being assigned is not a system role.
DROP POLICY IF EXISTS "Users can insert own role_assignments" ON role_assignments;
CREATE POLICY "Users can insert own role_assignments"
  ON role_assignments FOR INSERT
  WITH CHECK (
    user_id = get_current_user_id()
    AND NOT EXISTS (
      SELECT 1 FROM role_types rt
      WHERE rt.id = role_type_id
        AND rt.category = 'system'
    )
  );

-- UPDATE: own row (USING), and the resulting row is not a system role
-- (WITH CHECK). The previous policy had no WITH CHECK at all.
DROP POLICY IF EXISTS "Users can update own role_assignments" ON role_assignments;
CREATE POLICY "Users can update own role_assignments"
  ON role_assignments FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (
    user_id = get_current_user_id()
    AND NOT EXISTS (
      SELECT 1 FROM role_types rt
      WHERE rt.id = role_type_id
        AND rt.category = 'system'
    )
  );
