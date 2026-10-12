// Session check-in code rules, shared by the admin editor and the attendee
// check-in form. Mirrored server-side in check_in_to_session
// (supabase/migrations/00025_check_in_attempt_limit.sql); change both together.

/** Longest code an admin can set; longer attempts can never match. */
export const CHECK_IN_CODE_MAX_LENGTH = 15
/** Wrong codes allowed per session before check-in locks for a while. */
export const CHECK_IN_MAX_FAILURES = 5
export const CHECK_IN_LOCKOUT_MINUTES = 10

/**
 * Codes are matched case-insensitively, so show and store them in capitals:
 * what a member types then looks exactly like the code on the speaker's slide.
 * Leaves surrounding spaces alone so typing still feels normal; callers trim
 * on submit/save.
 */
export function formatCheckInCode(raw: string): string {
  return raw.toUpperCase().slice(0, CHECK_IN_CODE_MAX_LENGTH)
}
