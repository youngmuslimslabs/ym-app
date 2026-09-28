// Update the URL's query string without a server round-trip. Next.js (14.1+)
// keeps useSearchParams/usePathname in sync with native history calls, so
// back/forward and deep links still work — but unlike router.replace() this
// doesn't re-render the route's server components. Use it for client-only UI
// state (filters, view toggles) the server page never reads.
export function replaceSearchParams(pathname: string, params: URLSearchParams): void {
  const query = params.toString()
  if (query === window.location.search.replace(/^\?/, '')) return
  window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
}
