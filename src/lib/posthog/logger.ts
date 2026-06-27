import { SeverityNumber } from '@opentelemetry/api-logs'
import { loggerProvider } from './otel'

type LogAttrs = Record<string, string | number | boolean | undefined>

interface LogOptions {
  distinctId?: string
  sessionId?: string
  attrs?: LogAttrs
}

const otelLogger = loggerProvider.getLogger('ym-app')

function emit(
  severity: SeverityNumber,
  severityText: string,
  message: string,
  options: LogOptions = {}
) {
  otelLogger.emit({
    body: message,
    severityNumber: severity,
    severityText,
    attributes: {
      ...(options.distinctId ? { posthogDistinctId: options.distinctId } : {}),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...options.attrs,
    },
  })
}

export const logger = {
  info: (message: string, options?: LogOptions) =>
    emit(SeverityNumber.INFO, 'INFO', message, options),
  warn: (message: string, options?: LogOptions) =>
    emit(SeverityNumber.WARN, 'WARN', message, options),
  error: (message: string, options?: LogOptions) =>
    emit(SeverityNumber.ERROR, 'ERROR', message, options),
}
