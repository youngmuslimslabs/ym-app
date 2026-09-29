// Where to send someone after they sign in. Middleware adds `?next=/people/`
// when it bounces a signed-out visitor to /login; the login page reads it back.
//
// Only same-site paths are accepted, so a crafted link such as
// /login?next=https://evil.example can't send a member off-site after they
// sign in (an open redirect).

export const NEXT_PARAM = 'next'

// Never "return" to the auth flow itself.
const EXCLUDED_PREFIXES = ['/login', '/auth', '/onboarding']

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/')) return null
  // "//host" and "/\host" are protocol-relative URLs to another site.
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  let url: URL
  try {
    url = new URL(raw, 'http://same.origin')
  } catch {
    return null
  }
  if (url.origin !== 'http://same.origin') return null
  if (EXCLUDED_PREFIXES.some((p) => url.pathname.startsWith(p))) return null
  return url.pathname + url.search + url.hash
}

/** The login URL for a request, remembering the page it was headed to. */
export function loginUrlFor(requestUrl: URL, error?: string): URL {
  const url = new URL('/login/', requestUrl)
  if (error) url.searchParams.set('error', error)
  // Only remember real pages; an API call has no page to come back to.
  const next = safeNextPath(requestUrl.pathname + requestUrl.search)
  if (next && next !== '/' && !requestUrl.pathname.startsWith('/api/')) {
    url.searchParams.set(NEXT_PARAM, next)
  }
  return url
}
