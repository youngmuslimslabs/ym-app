import { logs } from '@opentelemetry/api-logs'

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    import('./src/lib/posthog/otel').then(({ loggerProvider }) => {
      logs.setGlobalLoggerProvider(loggerProvider)
    })
  }
}

export const onRequestError = async (
  err: unknown,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind: string
    routePath: string
    routeType: string
  }
) => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getPostHogServer } = await import('./src/lib/posthog/server')
    const posthog = getPostHogServer()

    const rawSession = request.headers['x-posthog-session-id']
    const rawDistinct = request.headers['x-posthog-distinct-id']
    const sessionId = Array.isArray(rawSession) ? rawSession[0] : rawSession
    const distinctId = Array.isArray(rawDistinct) ? rawDistinct[0] : rawDistinct

    await posthog.captureExceptionImmediate(err, distinctId ?? 'server', {
      ...(sessionId ? { $session_id: sessionId } : {}),
      $current_url: request.path,
      route_path: context.routePath,
      route_type: context.routeType,
    })
  }
}
