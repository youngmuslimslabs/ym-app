'use client'

import { useEffect } from 'react'
import { ErrorFallbackCard } from '@/components/ErrorFallbackCard'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return <ErrorFallbackCard onReset={reset} error={error} />
}
