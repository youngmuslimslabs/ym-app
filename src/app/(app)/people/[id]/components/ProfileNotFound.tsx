'use client'

import { UserX } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

export function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <PageHeader title="Not Found" back={{ href: '/people', label: 'Back to directory' }} />

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted/50 p-4">
          <UserX className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="ym-h3 mb-1">Profile not found</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          This person doesn&apos;t exist or their profile isn&apos;t available yet.
        </p>
      </div>
    </div>
  )
}
