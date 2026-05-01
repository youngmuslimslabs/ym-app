-- Seed feedback rows for visual verification of Stage 6 (admin feedback tab +
-- comments drilldown).
--
-- DEV-ONLY. NOT PART OF THE REGRESSION SUITE — see
-- supabase/seed/conference-smoke-test.sql for that. This script exists purely
-- to populate the admin feedback views for eyeballing in a browser.
--
-- DEPENDENCY: a conference named exactly "YM Spring Convention 2026" with at
-- least one ended (non-break) session and at least one row in
-- conference_attendees. Without that fixture the script is a no-op (CTEs
-- return empty sets) — the trailing SELECT will simply return zero rows.
--
-- USAGE: paste into the Supabase dashboard SQL editor and Run.
-- TEARDOWN: see the DELETE block at the bottom (commented out).
--
-- Idempotent — re-run cleanly thanks to the (session_id, user_id) UNIQUE
-- constraint + ON CONFLICT DO NOTHING.

WITH conf AS (
  SELECT id FROM conferences WHERE name = 'YM Spring Convention 2026' LIMIT 1
),
target_sessions AS (
  SELECT s.id, s.title
  FROM sessions s
  JOIN conf ON s.conference_id = conf.id
  WHERE s.is_break = false AND s.end_at < now()
),
attendees AS (
  -- Up to 5 invited attendees so each session gets a meaningful avg rating.
  SELECT u.id, row_number() OVER (ORDER BY u.created_at) AS rn
  FROM users u
  JOIN conference_attendees ca ON ca.user_id = u.id
  JOIN conf ON ca.conference_id = conf.id
  LIMIT 5
),
rating_grid AS (
  SELECT
    s.id   AS session_id,
    s.title,
    a.id   AS user_id,
    a.rn,
    -- Per-attendee rating, fixed by title so the seeded ranking is stable.
    (CASE s.title
      WHEN 'The Ethics of Community Building'    THEN ARRAY[5, 5, 4, 5, 4]
      WHEN 'Organizing Across Generations'       THEN ARRAY[4, 5, 4, 3, 4]
      WHEN 'Digital Organizing: Beyond WhatsApp' THEN ARRAY[3, 4, 3, 3, 4]
      WHEN 'Budgeting a NeighborNet'             THEN ARRAY[5, 4, 4, 5, 5]
      WHEN 'Closing Reflections'                 THEN ARRAY[2, 3, 2, 3, 3]
      ELSE ARRAY[3, 3, 3, 3, 3]
    END)[a.rn::int] AS rating,
    (CASE s.title
      WHEN 'The Ethics of Community Building'    THEN ARRAY['Loved the framing on accountability.', 'Best session of the day.', 'Could go deeper on case studies.', NULL, 'Notes I will share with my chapter.']
      WHEN 'Organizing Across Generations'       THEN ARRAY['Great panel — wish it ran longer.', NULL, 'Some tension I appreciated.', 'A bit broad.', NULL]
      WHEN 'Digital Organizing: Beyond WhatsApp' THEN ARRAY['Practical, but skipped a few tools.', 'Decent.', NULL, NULL, 'Hoped for more on Signal.']
      WHEN 'Budgeting a NeighborNet'             THEN ARRAY['Hands-on and clear.', 'Worth the time.', NULL, 'Take this twice if you can.', 'Spreadsheet template was gold.']
      WHEN 'Closing Reflections'                 THEN ARRAY[NULL, 'Felt rushed.', NULL, 'I missed the end.', 'Energy was low by then.']
      ELSE ARRAY[NULL, NULL, NULL, NULL, NULL]
    END)[a.rn::int] AS comment
  FROM target_sessions s
  CROSS JOIN attendees a
)
INSERT INTO session_feedback (session_id, user_id, rating, comment, created_at)
SELECT
  session_id,
  user_id,
  rating,
  comment,
  -- Stagger so the drilldown sheet's desc sort produces real ordering.
  now() - (rn || ' hours')::interval
FROM rating_grid
WHERE rating IS NOT NULL
ON CONFLICT (session_id, user_id) DO NOTHING;

-- Sanity-check view: one row per session with count + avg.
SELECT s.title,
       count(*) AS responses,
       round(avg(f.rating)::numeric, 2) AS avg_rating
FROM session_feedback f
JOIN sessions s     ON s.id = f.session_id
JOIN conferences c  ON c.id = s.conference_id
WHERE c.name = 'YM Spring Convention 2026'
GROUP BY s.title
ORDER BY avg_rating DESC NULLS LAST;

-- TEARDOWN (uncomment to undo this seed):
-- DELETE FROM session_feedback f
-- USING sessions s, conferences c
-- WHERE f.session_id = s.id
--   AND s.conference_id = c.id
--   AND c.name = 'YM Spring Convention 2026';
