-- ============================================================================
-- 00002_users_onboarding_immutable.sql
-- ============================================================================
-- Enforces that public.users.onboarding_completed_at is set exactly once and
-- never changed thereafter. The `Users can update own profile` RLS policy on
-- users has no WITH CHECK clause, so an authenticated user can PATCH their
-- onboarding_completed_at directly. That is self-inflicted (a user can only
-- affect their own row), but the app treats the flag as immutable — the
-- middleware reads it to route between /onboarding and /home, and a user who
-- rewrote or cleared it could bounce themselves back through onboarding or
-- forge a completion date.
--
-- Product todos ref: P2 #25 "Block client-set onboarding flag".
--
-- Legit write path (untouched by this trigger):
--   src/lib/supabase/onboarding.ts completeOnboarding() — NULL → now()
--
-- Rejected transitions:
--   - non-NULL → NULL              (un-complete)
--   - non-NULL → any other value   (rewrite / backdate)
--
-- The trigger is BEFORE UPDATE so it aborts the write before the row is
-- rewritten and before the updated_at trigger fires. It fires for every role
-- (including service_role) — no privileged path today needs to rewrite this
-- column, so the strict guard is correct as-is.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_users_onboarding_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.onboarding_completed_at IS NOT NULL
     AND NEW.onboarding_completed_at IS DISTINCT FROM OLD.onboarding_completed_at THEN
    RAISE EXCEPTION 'users.onboarding_completed_at is immutable once set'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_users_onboarding_immutable ON public.users;
CREATE TRIGGER enforce_users_onboarding_immutable
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_users_onboarding_immutable();
