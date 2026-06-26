-- Unique partial index: only one in_progress row allowed at a time.
-- The INSERT in the sync route uses this as an atomic lock — if another
-- sync is already running, the INSERT fails with code 23505 (unique
-- violation), which the route catches and returns as 409. This eliminates
-- the check-then-insert race window that existed before.
CREATE UNIQUE INDEX sync_logs_one_active
  ON sync_logs (status)
  WHERE status = 'in_progress';

-- Composite index for the status filter + started_at ORDER BY used when
-- querying sync history.
CREATE INDEX sync_logs_status_started_at
  ON sync_logs (status, started_at DESC);
