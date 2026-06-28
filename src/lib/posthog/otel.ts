import { SimpleLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'

const exporter = new OTLPLogExporter({
  url: 'https://us.i.posthog.com/i/v1/logs',
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''}`,
    'Content-Type': 'application/json',
  },
})

export const loggerProvider = new LoggerProvider({
  resource: resourceFromAttributes({ 'service.name': 'ym-app' }),
  processors: [new SimpleLogRecordProcessor(exporter)],
})
