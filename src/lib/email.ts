/**
 * Canonicalize an email for storage and lookup.
 *
 * Emails are matched case-insensitively across the app (the Google sync
 * seeds users, and the auth trigger links the login identity to that row).
 * If a seeded address and the OAuth identity differ only in case or
 * surrounding whitespace, an exact-match lookup misses and a duplicate row
 * is created — which then collides with the `email` UNIQUE constraint inside
 * the auth transaction and fails the login. Normalizing both sides to
 * lowercase + trimmed prevents that fork. Mirrors `lower(email)` in the DB
 * (migration 00017).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
