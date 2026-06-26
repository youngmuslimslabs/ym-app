export function register() {
  // Next.js requires this export — no setup needed
}

export const onRequestError = async (
  err: unknown,
  request: {
    headers: { get: (key: string) => string | null }
    url: string
  },
  _context: unknown
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = await import('./src/lib/posthog/server')
    const posthog = getPostHogServer()
    const sessionId = request.headers.get('X-POSTHOG-SESSION-ID')
    const distinctId = request.headers.get('X-POSTHOG-DISTINCT-ID')
    await posthog.captureException(err as Error, distinctId ?? 'server', {
      $session_id: sessionId ?? undefined,
      $current_url: request.url,
    })
  }
}
