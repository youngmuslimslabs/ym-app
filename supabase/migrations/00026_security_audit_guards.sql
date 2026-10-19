-- #82. Additive: no data rewrite. Review/apply separately after a live backup.
-- 00024/00025 are reserved by PRs #93/#92. No generated type change is needed.
BEGIN;

-- An authenticated JWT alone is insufficient: only linked organization members
-- may use the organization-wide read policies. Definer avoids users RLS recursion.
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_id = auth.uid() AND lower(email) LIKE '%@youngmuslims.com'
  );
$$;

-- USING tests the OLD row; WITH CHECK tests the NEW row. Both are necessary:
-- protecting only the new category permits retagging a protected system role.
DROP POLICY IF EXISTS "Users can update own role_assignments" ON public.role_assignments;
CREATE POLICY "Users can update own role_assignments" ON public.role_assignments FOR UPDATE
  USING (
    user_id = public.get_current_user_id()
    AND NOT EXISTS (SELECT 1 FROM public.role_types rt
      WHERE rt.id = role_assignments.role_type_id AND rt.category = 'system')
  )
  WITH CHECK (
    user_id = public.get_current_user_id()
    AND NOT EXISTS (SELECT 1 FROM public.role_types rt
      WHERE rt.id = role_assignments.role_type_id AND rt.category = 'system')
  );

-- Includes the delta proposed in #47, so an existing populated DB is protected.
DROP POLICY IF EXISTS "Users can delete own role_assignments" ON public.role_assignments;
CREATE POLICY "Users can delete own role_assignments" ON public.role_assignments FOR DELETE
  USING (
    user_id = public.get_current_user_id()
    AND NOT EXISTS (SELECT 1 FROM public.role_types rt
      WHERE rt.id = role_assignments.role_type_id AND rt.category = 'system')
  );

-- Ownership of a profile must not imply authority to rebind its login identity.
-- Invoker role remains authenticated for direct PostgREST writes; server-side
-- provisioning with service_role and owner-led maintenance can still link rows.
CREATE OR REPLACE FUNCTION public.protect_user_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.auth_id IS DISTINCT FROM OLD.auth_id OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.claimed_at IS DISTINCT FROM OLD.claimed_at
  ) THEN
    RAISE EXCEPTION 'Login identity fields are managed by the server'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_user_identity ON public.users;
CREATE TRIGGER protect_user_identity BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_identity();

-- RPCs already check the caller internally; remove anonymous execution too.
REVOKE EXECUTE ON FUNCTION public.signup_for_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_signup(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_in_to_session(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_attendee(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.publish_conference(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.signup_for_session(uuid),
  public.cancel_signup(uuid), public.check_in_to_session(uuid, text),
  public.remove_attendee(uuid, uuid), public.publish_conference(uuid)
  TO authenticated, service_role;

COMMIT;
