import type { TagOption } from '@/components/tag-chip-selector'

/**
 * Contribution tags replace the old free-text "What did you do?" fields on Roles
 * and Projects. They are stored comma-joined in the existing text columns
 * (role_assignments.notes / user_projects.description) — no schema change.
 */
export const CONTRIBUTION_TAGS: TagOption[] = [
  'Led a team',
  'Logistics',
  'Fundraising',
  'Mentorship',
  'Content / Media',
  'Ops',
  'Event planning',
  'Outreach',
].map((t) => ({ value: t, label: t }))

/** Split a stored comma-joined string into trimmed, non-empty tags. */
export function parseTags(stored?: string): string[] {
  if (!stored) return []
  return stored
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Join tags back into the comma-separated string stored in the DB text column. */
export function serializeTags(tags: string[]): string {
  return tags.join(', ')
}

/** Toggle a tag's membership in the list. */
export function toggleTag(tags: string[], tag: string): string[] {
  return tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
}
