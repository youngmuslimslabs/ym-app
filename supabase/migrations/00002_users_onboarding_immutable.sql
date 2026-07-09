-- ============================================================================
-- 00002_users_onboarding_immutable.sql
-- ============================================================================
-- The `Users can update own profile` RLS policy has no WITH CHECK clause, so an
-- authenticated user could PATCH their own onboarding_completed_at directly.
-- Middleware reads this flag to route between /onboarding and /home, so an
-- attacker who cleared it could bounce themselves back through onboarding and
-- one who backdated it could forge a completion date.
--
-- Product todos ref: P2 #25 "Block client-set onboarding flag".
--
-- Semantics of this guard:
--   INSERT — new rows are forced to NULL onboarding_completed_at, so a
--            client-driven insert path (auth trigger, sync, future invite
--            acceptance flow) cannot ship a forged completion timestamp on the
--            first row version.
--   UPDATE — once set, the column is silently preserved. A retry of the legit
--            completion path (completeOnboarding, which sends a fresh
--            `new Date().toISOString()` each call — network retry, tab race,
--            middleware transient fallthrough) succeeds without changing the
--            stored timestamp, so the user is not shown a spurious 'Failed to
--            complete onboarding' after they are actually done. NULL → non-NULL
--            (first completion) is untouched.
--
-- The UPDATE trigger is `BEFORE UPDATE OF onboarding_completed_at` so it only
-- fires when the guarded column is written, matching the pattern used by
-- `conferences_one_way_publish` and `sessions_capacity_floor` in the baseline
-- and avoiding wasted plpgsql calls on every profile save.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_users_onboarding_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.onboarding_completed_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_users_onboarding_insert ON public.users;
CREATE TRIGGER enforce_users_onboarding_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_users_onboarding_insert();

CREATE OR REPLACE FUNCTION public.enforce_users_onboarding_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.onboarding_completed_at IS NOT NULL THEN
    NEW.onboarding_completed_at := OLD.onboarding_completed_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_users_onboarding_immutable ON public.users;
CREATE TRIGGER enforce_users_onboarding_immutable
  BEFORE UPDATE OF onboarding_completed_at ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_users_onboarding_immutable();
