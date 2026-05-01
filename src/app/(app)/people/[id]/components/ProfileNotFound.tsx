'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, ArrowRight, User } from 'lucide-react'

export function ProfileNotFound() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/people')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to directory</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-lg font-semibold">Error</h1>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-md space-y-6">
          <div className="rounded-full bg-muted p-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Profile Not Found
            </h2>
            <p className="text-muted-foreground">
              This person doesn&apos;t exist or their profile isn&apos;t available yet.
            </p>
          </div>

          <Button onClick={() => router.push('/people')} size="lg">
            Back to Directory
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}
