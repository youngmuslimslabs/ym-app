-- Part-2 profile-completion signal.
--
-- Set when all six profile sections are resolved (filled, or — for Roles /
-- Projects — explicitly skipped). Feature gates read `profile_completed_at
-- IS NOT NULL` as the single source of truth for "profile complete"
-- (skip-safe; independent of the client-side percent used for display).
--
-- Nullable + additive, no backfill: existing rows stay NULL (= incomplete),
-- which is the correct default. Safe to apply to the populated table.
--
-- Numbering: geography seed took 00020 on its own branch; this is 00021 to
-- avoid a merge collision.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;
