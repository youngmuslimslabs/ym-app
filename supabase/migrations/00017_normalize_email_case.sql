-- Migration: Normalize email casing for auth-trigger user linking
-- =====================================================================
-- Fixes a login-breaking bug. link_auth_to_user matched pre-seeded users by
-- exact-case email (WHERE email = NEW.email). If a seeded address and the
-- Google OAuth identity differed only in case or surrounding whitespace, the
-- link UPDATE matched nothing, the fallback INSERT fired, and it collided
-- with the email UNIQUE constraint INSIDE the auth transaction — aborting the
-- whole auth.users insert, so the user could not sign in at all. The domain
-- gate (NOT LIKE '%@youngmuslims.com') was also case-sensitive, so e.g.
-- User@YoungMuslims.com would be wrongly skipped.
--
-- Fix: normalize to lower(trim(email)) for both the match and the insert,
-- gate the domain case-insensitively, normalize existing rows, and enforce
-- case-insensitive uniqueness with a unique index on lower(email). The Google
-- sync script normalizes identically (src/lib/email.ts).
--
-- Only the function body changes; the AFTER INSERT trigger on auth.users that
-- calls it (created in 00005) stays bound via CREATE OR REPLACE.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.link_auth_to_user()
RETURNS TRIGGER AS $$
DECLARE
  _email TEXT;
  _full_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
BEGIN
  _email := lower(trim(NEW.email));

  -- Only process @youngmuslims.com emails (now case-insensitive).
  IF _email NOT LIKE '%@youngmuslims.com' THEN
    RETURN NEW;
  END IF;

  -- Extract name from Google metadata (full_name/name, not given/family).
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  _first_name := split_part(_full_name, ' ', 1);
  _last_name := NULLIF(trim(substring(_full_name from position(' ' in _full_name) + 1)), '');

  -- If full_name has no space, last_name would equal first_name; fix that.
  IF _last_name = _first_name THEN
    _last_name := NULL;
  END IF;

  -- Link to an existing pre-seeded user, matching case-insensitively. The
  -- single-match guarantee (at most one unclaimed row per lower(email))
  -- relies on the users_email_lower_key unique index created at the bottom
  -- of this migration.
  UPDATE public.users
  SET
    auth_id = NEW.id,
    claimed_at = now(),
    updated_at = now(),
    first_name = COALESCE(first_name, NULLIF(_first_name, '')),
    last_name = COALESCE(last_name, _last_name),
    avatar_url = COALESCE(avatar_url, NEW.raw_user_meta_data->>'avatar_url')
  WHERE lower(email) = _email
    AND auth_id IS NULL;

  -- No pre-seeded row — create one with the normalized email.
  IF NOT FOUND THEN
    INSERT INTO public.users (
      id,
      email,
      auth_id,
      first_name,
      last_name,
      avatar_url,
      claimed_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      _email,
      NEW.id,
      NULLIF(_first_name, ''),
      _last_name,
      NEW.raw_user_meta_data->>'avatar_url',
      now(),
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Normalize any existing rows so the unique index can be built and future
-- lookups match. If two rows differ only by case, this raises a unique
-- violation on the existing email constraint — that intentionally surfaces a
-- real duplicate to resolve by hand (expected to be none in fresh data).
--
-- OPERATOR PRE-CHECK: before `supabase db push`, run this and expect zero
-- rows. Any result is a case-duplicate that must be merged by hand first,
-- otherwise the UPDATE below aborts the migration:
--   SELECT lower(trim(email)) AS normalized, count(*)
--   FROM public.users GROUP BY 1 HAVING count(*) > 1;
UPDATE public.users
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

-- Enforce case-insensitive uniqueness at the DB level so two rows can never
-- again differ only by case.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
  ON public.users (lower(email));
