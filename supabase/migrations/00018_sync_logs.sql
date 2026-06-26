-- Audit log for Google Workspace user syncs.
-- Doubles as a concurrent-sync lock: any row with status='in_progress'
-- and started_at < 120s ago blocks a new sync from starting.
CREATE TABLE sync_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by  UUID        NOT NULL REFERENCES users(id),
  status        TEXT        NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress', 'completed', 'failed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  total_count   INT,
  created_count INT,
  updated_count INT,
  skipped_count INT,
  errors_count  INT
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can read sync_logs"
  ON sync_logs FOR SELECT
  USING (is_event_admin(get_current_user_id()));
