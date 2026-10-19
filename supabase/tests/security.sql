\set ON_ERROR_STOP on
BEGIN;
CREATE FUNCTION pg_temp.assert(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Assertion failed: %', message; END IF; END;
$$;

-- Fixed synthetic identities, deliberately not real member records.
INSERT INTO auth.users(id,email) VALUES
  ('10000000-0000-4000-8000-000000000001','member@youngmuslims.com'),
  ('10000000-0000-4000-8000-000000000002','admin@youngmuslims.com'),
  ('10000000-0000-4000-8000-000000000003','outsider@example.org');
-- auth trigger creates only the two organization profiles.
INSERT INTO public.role_assignments(user_id,role_type_id,start_date)
SELECT u.id, rt.id, '2026-01-01'::date FROM public.users u CROSS JOIN public.role_types rt
WHERE u.email IN ('member@youngmuslims.com','admin@youngmuslims.com') AND rt.code='event_admin';
INSERT INTO public.role_assignments(user_id,role_type_id,start_date)
SELECT u.id, rt.id, '2026-01-01'::date FROM public.users u CROSS JOIN public.role_types rt
WHERE u.email='member@youngmuslims.com' AND rt.code='ns_member';

SELECT pg_temp.assert(NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
), 'all public app tables enable RLS');

SET LOCAL ROLE anon;
SELECT pg_temp.assert((SELECT count(*) FROM public.users)=0, 'anonymous directory read is empty');
SELECT pg_temp.assert(NOT has_function_privilege('anon','public.check_in_to_session(uuid,text)','EXECUTE'), 'anonymous check-in RPC denied');
RESET ROLE;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
SELECT pg_temp.assert(NOT public.is_authenticated(), 'outside-domain JWT is not a member');
SELECT pg_temp.assert((SELECT count(*) FROM public.users)=0, 'outside-domain JWT cannot read directory');
SELECT set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
SELECT pg_temp.assert(public.is_authenticated(), 'organization member is recognized');
SELECT pg_temp.assert((SELECT count(*) FROM public.users)=2, 'member can read organization directory');

-- Legitimate profile updates still work.
UPDATE public.users SET first_name='Updated' WHERE auth_id=auth.uid();
SELECT pg_temp.assert((SELECT first_name FROM public.users WHERE auth_id=auth.uid())='Updated', 'ordinary profile edit succeeds');
DO $$ BEGIN
  BEGIN
    UPDATE public.users SET email='hijack@youngmuslims.com' WHERE auth_id=auth.uid();
    RAISE EXCEPTION 'identity rewrite unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.users SET auth_id=NULL WHERE auth_id=auth.uid();
    RAISE EXCEPTION 'identity unlink unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    UPDATE public.users SET claimed_at=now() + interval '1 hour' WHERE auth_id=auth.uid();
    RAISE EXCEPTION 'identity claim rewrite unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

-- System roles cannot be deleted, deactivated, or retagged by their owner.
DELETE FROM public.role_assignments WHERE user_id=public.get_current_user_id()
  AND role_type_id=(SELECT id FROM public.role_types WHERE code='event_admin');
UPDATE public.role_assignments SET role_type_id=(SELECT id FROM public.role_types WHERE code='ct_member')
  WHERE user_id=public.get_current_user_id() AND role_type_id=(SELECT id FROM public.role_types WHERE code='event_admin');
SELECT pg_temp.assert(public.is_event_admin(public.get_current_user_id()), 'protected system role survives delete and retag');
DO $$ BEGIN
  BEGIN
    INSERT INTO public.role_assignments(user_id,role_type_id)
    SELECT public.get_current_user_id(), id FROM public.role_types WHERE code='event_admin';
    RAISE EXCEPTION 'self-grant unexpectedly allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
UPDATE public.users SET first_name='Intrusion' WHERE auth_id='10000000-0000-4000-8000-000000000002';
SELECT pg_temp.assert(NOT EXISTS(SELECT 1 FROM public.users WHERE first_name='Intrusion'), 'cross-user profile writes denied');
DELETE FROM public.role_assignments WHERE user_id=public.get_current_user_id()
  AND role_type_id=(SELECT id FROM public.role_types WHERE code='ns_member');
SELECT pg_temp.assert(NOT EXISTS(SELECT 1 FROM public.role_assignments
  WHERE user_id=public.get_current_user_id() AND role_type_id=(SELECT id FROM public.role_types WHERE code='ns_member')), 'ordinary role remains editable');
RESET ROLE;

-- Provisioning/owner maintenance still works.
SET LOCAL ROLE service_role;
UPDATE public.users SET email='updated@youngmuslims.com'
  WHERE auth_id='10000000-0000-4000-8000-000000000001';
SELECT pg_temp.assert(EXISTS(SELECT 1 FROM public.users WHERE email='updated@youngmuslims.com'), 'server identity maintenance succeeds');
RESET ROLE;
ROLLBACK;
\echo Security regression assertions passed.
