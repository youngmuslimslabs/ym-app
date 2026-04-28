import type { Conference, ConferenceLifecycleStatus } from '../types'

// Locked decision: derive Live/Draft/Past from status + dates in one helper,
// not stored as a column. `now` defaults to today so callers can stub for tests.
//
// - Draft: status === 'draft' (regardless of dates)
// - Live:  status === 'published' AND today is within [start_date, end_date]
// - Past:  status === 'published' AND today > end_date
// - Treat published+future as Live's "Active" sibling (it's still listed under
//   the Active section of the dashboard); the badge label is just "Live" once
//   we're inside the date range, "Draft" if not yet published.
export function getConferenceLifecycleStatus(
  c: Pick<Conference, 'status' | 'start_date' | 'end_date'>,
  now: Date = new Date()
): ConferenceLifecycleStatus {
  if (c.status === 'draft') return 'draft'
  const today = now.toISOString().slice(0, 10)
  if (c.end_date < today) return 'past'
  return 'live'
}

// "Active" = anything that is not Past. Used to split the dashboard into
// Active vs Past. Drafts and not-yet-started published conferences both live
// under Active because they all need attention.
export function isActiveConference(
  c: Pick<Conference, 'status' | 'start_date' | 'end_date'>,
  now: Date = new Date()
): boolean {
  return getConferenceLifecycleStatus(c, now) !== 'past'
}
