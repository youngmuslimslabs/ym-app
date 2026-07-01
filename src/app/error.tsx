'use client'

import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { ErrorFallbackCard } from '@/components/ErrorFallbackCard'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  const posthog = usePostHog()

  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  useEffect(() => {
    posthog?.captureException(error)
  }, [error, posthog])

  return <ErrorFallbackCard onReset={reset} error={error} />
}
