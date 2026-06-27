import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { logs } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': 'ym-app' }),
  processors: [
    new BatchLogRecordProcessor(
      new OTLPLogExporter({
        url: 'https://us.i.posthog.com/i/v1/logs',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
      })
    ),
  ],
})

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    logs.setGlobalLoggerProvider(loggerProvider)
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
