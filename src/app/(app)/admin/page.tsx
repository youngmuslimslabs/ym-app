import { Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { requireAdmin } from './conferences/data'
import { SyncGoogleUsersButton } from './components/SyncGoogleUsersButton'

export const dynamic = 'force-dynamic'

export default async function AdminToolsPage() {
  await requireAdmin()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-16 pt-8 sm:px-10 sm:pt-12">
      <PageHeader
        eyebrow="Internal"
        title="Admin Tools"
        description="Utilities for managing the app. Not linked anywhere."
      />

      <section className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-muted/50 p-4">
            <Users className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="ym-h3">Sync Google Workspace Users</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Pulls all @youngmuslims.com accounts from Google and adds any new ones to the database. Safe to run anytime — never overwrites existing data.
            </p>
          </div>
        </div>
        <SyncGoogleUsersButton />
      </section>
    </div>
  )
}
