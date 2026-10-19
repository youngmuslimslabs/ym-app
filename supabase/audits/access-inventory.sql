-- #82. Catalog-only inventory; no member records, no writes.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS forced_rls
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p') ORDER BY 1;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;

SELECT p.oid::regprocedure AS function_name, p.prosecdef AS security_definer,
  p.proconfig AS settings,
  has_function_privilege('anon',p.oid,'EXECUTE') AS anonymous_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') AS member_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.prosecdef ORDER BY 1;

SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public' AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, privilege_type;
