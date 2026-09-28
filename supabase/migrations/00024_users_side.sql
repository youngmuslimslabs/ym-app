-- ============================================================================
-- 00024_users_side.sql
-- ============================================================================
-- Brothers / Sisters: which side of the organization a member belongs to.
--
-- Chosen once during onboarding (required) and shown in the directory. It
-- also selects the Brothers or Sisters brand theme in the app.
--
-- Nullable + additive, no backfill: existing rows stay NULL until the member
-- answers the one-question prompt the app shows on their next sign-in. Safe to
-- apply to the populated table.
--
-- Immutable for app users once set: a signed-in user can set it from NULL
-- exactly once; any later change through the API (roles `authenticated` /
-- `anon`) is rejected. Admin corrections go through the SQL editor or the
-- service role, which the trigger lets through. The existing
-- "Users can update own profile" RLS policy already covers the column.
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS side TEXT
  CONSTRAINT users_side_check CHECK (side IN ('brothers', 'sisters'));

COMMENT ON COLUMN public.users.side IS
  'brothers | sisters. Set once in onboarding; admin-only changes after (see enforce_users_side_immutable).';

CREATE OR REPLACE FUNCTION public.enforce_users_side_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.side IS NOT NULL
     AND NEW.side IS DISTINCT FROM OLD.side
     AND current_user IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'side cannot be changed once set'
      USING ERRCODE = 'check_violation',
            HINT = 'An admin can correct it from the SQL editor.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_users_side_immutable ON public.users;
CREATE TRIGGER enforce_users_side_immutable
  BEFORE UPDATE OF side ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_users_side_immutable();
