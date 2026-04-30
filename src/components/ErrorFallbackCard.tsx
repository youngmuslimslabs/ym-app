'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorFallbackCardProps {
  /** Headline copy. Defaults to the standard "hit a snag" message. */
  title?: string
  /** Body copy below the headline. */
  message?: string
  /** Reset callback fired from the "Try Again" button. */
  onReset: () => void
  /** Underlying Error to render in the dev-only details panel. */
  error?: (Error & { digest?: string }) | null
}

const DEFAULT_TITLE = 'Hit a snag rendering this page.'
const DEFAULT_MESSAGE = "Your work is saved. Try again, or head home if it persists."

export function ErrorFallbackCard({
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  onReset,
  error,
}: ErrorFallbackCardProps) {
  const showDetails = process.env.NODE_ENV === 'development' && error

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md border-destructive/20" role="alert">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>

          {showDetails && (
            <details className="mt-4 w-full rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
              <summary className="cursor-pointer text-sm font-medium text-destructive">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 overflow-auto text-xs text-destructive/80">
                {error.message}
                {error.digest && `\n\nDigest: ${error.digest}`}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={onReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
