interface ConferenceAttendanceSectionProps {
  userId: string
}

/**
 * Renders the user's most imminent conference attendance, between the
 * home page greeting and the hairline rule. Returns null when no
 * attendance exists.
 *
 * Currently a no-op: the `conferences` table lives on the
 * `feature/conferences` branch and is not yet on `main`. Once that
 * branch merges, this component should:
 *
 *   1. Add a `fetchUpcomingAttendance(userId)` query that joins
 *      `conference_attendees` → `conferences`, filters by
 *      `c.status = 'published' AND c.end_date >= today AND
 *      c.start_date <= today + interval '30 days'`, orders by
 *      `c.start_date ASC`, and returns the first row (or null).
 *   2. Compute `isLive = today >= start_date && today <= end_date`.
 *   3. Render the design from the editorial Variant D prototype at
 *      docs/prototypes/2026-04-30-home-dashboard/index.html — eyebrow
 *      (cobalt) + dot (success green, with `.animate-status-pulse`
 *      when `isLive`), conference name, date range, and a
 *      "View your schedule" link to `/conferences/{conferenceId}`.
 *   4. NO adaptive copy ("Day 2 of 3", session counts) — those wait
 *      for real product signals once the conferences feature has
 *      surfaced user behavior worth designing around.
 */
export async function ConferenceAttendanceSection({
  userId,
}: ConferenceAttendanceSectionProps) {
  void userId
  return null
}
