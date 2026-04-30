export interface UserMessageContext {
  /** Human verb the user just attempted, e.g. "save profile" or "load conferences". */
  action?: string
  /** Override copy for unique-violation / 409 conflict cases that need domain context. */
  conflictMessage?: string
}

interface ErrorLike {
  name?: string
  message?: string
  code?: string | number
  status?: number
  statusCode?: number
}

const NETWORK_PATTERNS =
  /(network|fetch|offline|connection|timeout|enotfound|econnrefused|aborted)/i
const PERMISSION_PATTERNS =
  /(permission|denied|forbidden|unauthori[sz]ed|not\s+authori[sz]ed|row[-\s]level\s+security)/i
const UNIQUE_PATTERNS =
  /(duplicate|unique|already\s+(?:exists|in\s+use|registered|taken))/i
const CONSTRAINT_PATTERNS =
  /(violates\s+(?:foreign\s+key|check)\s+constraint|invalid\s+input\s+value)/i
const NOT_FOUND_PATTERNS = /(not\s+found|no\s+rows|missing\s+row)/i
const SERVER_PATTERNS = /(internal\s+server|service\s+unavailable|bad\s+gateway)/i

const FALLBACK =
  'Something went sideways. Your work is saved — try again or reload.'

function asErrorLike(err: unknown): ErrorLike | null {
  if (err === null || err === undefined) return null
  if (typeof err === 'string') return err.length > 0 ? { message: err } : null
  if (typeof err === 'object') return err as ErrorLike
  return null
}

function getStatus(e: ErrorLike): number | undefined {
  return typeof e.status === 'number'
    ? e.status
    : typeof e.statusCode === 'number'
      ? e.statusCode
      : undefined
}

function codeMatches(e: ErrorLike, code: string | number): boolean {
  return e.code === code || e.code === String(code) || e.code === Number(code)
}

function isNetworkFailure(e: ErrorLike): boolean {
  if (e.name === 'TypeError' && (e.message ?? '').toLowerCase().includes('fetch')) {
    return true
  }
  if (e.name === 'NetworkError' || e.name === 'AbortError') return true
  return NETWORK_PATTERNS.test(e.message ?? '')
}

function isPermissionFailure(e: ErrorLike): boolean {
  if (codeMatches(e, '42501')) return true
  const status = getStatus(e)
  if (status === 401 || status === 403) return true
  return PERMISSION_PATTERNS.test(e.message ?? '')
}

function isConflict(e: ErrorLike): boolean {
  if (codeMatches(e, '23505')) return true
  if (getStatus(e) === 409) return true
  return UNIQUE_PATTERNS.test(e.message ?? '')
}

function isConstraintViolation(e: ErrorLike): boolean {
  if (codeMatches(e, '23503') || codeMatches(e, '23514')) return true
  return CONSTRAINT_PATTERNS.test(e.message ?? '')
}

function isSessionExpired(e: ErrorLike): boolean {
  return e.code === 'PGRST301'
}

function isNotFound(e: ErrorLike): boolean {
  if (getStatus(e) === 404) return true
  if (e.code === 'PGRST116') return true
  return NOT_FOUND_PATTERNS.test(e.message ?? '')
}

function isServerError(e: ErrorLike): boolean {
  const s = getStatus(e)
  if (s !== undefined && s >= 500 && s < 600) return true
  return SERVER_PATTERNS.test(e.message ?? '')
}

/**
 * Translate an arbitrary error value into user-recovery copy suitable for
 * toast.error / inline display. Accepts strings (legacy `result.error`),
 * Error objects, PostgrestError-shaped objects, or anything else.
 *
 * Always pair with `console.error(err)` for ops/Sentry — this function is
 * lossy by design.
 */
export function toUserMessage(err: unknown, ctx?: UserMessageContext): string {
  const e = asErrorLike(err)
  if (!e) return FALLBACK

  if (isSessionExpired(e)) {
    return 'Your session expired. Sign in again to keep going.'
  }
  if (isNetworkFailure(e)) {
    return "Couldn't reach our servers — your changes are still here. Try again?"
  }
  if (isPermissionFailure(e)) {
    return "You don't have access to do that. Reach out to an admin if that's not right."
  }
  if (isConflict(e)) {
    return ctx?.conflictMessage ?? "That's already in use. Try a different value."
  }
  if (isConstraintViolation(e)) {
    return ctx?.action
      ? `Couldn't ${ctx.action} — some of the input doesn't fit. Double-check and try again.`
      : "Some of the input doesn't fit. Double-check and try again."
  }
  if (isNotFound(e)) {
    return ctx?.action
      ? `We couldn't find what you needed to ${ctx.action}.`
      : "We couldn't find what you were looking for."
  }
  if (isServerError(e)) {
    return ctx?.action
      ? `Something's off on our end while trying to ${ctx.action}. Try again in a moment.`
      : "Something's off on our end. Try again in a moment."
  }

  return FALLBACK
}
