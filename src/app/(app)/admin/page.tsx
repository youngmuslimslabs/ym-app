import { Users } from 'lucide-react'
import { requireAdmin } from './conferences/data'
import { SyncGoogleUsersButton } from './components/SyncGoogleUsersButton'

export const dynamic = 'force-dynamic'

export default async function AdminToolsPage() {
  await requireAdmin()

  return (
    <>
      <div className="px-6 md:px-8 pt-10 md:pt-12 pb-6 border-b">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Internal
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Admin Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Utilities for managing the app. Not linked anywhere.
        </p>
      </div>

      <div className="px-6 md:px-8 py-8 space-y-4">
        <div className="rounded-xl border bg-card p-6 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-muted/50 p-3 mt-0.5">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Sync Google Workspace Users</h2>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-sm">
                Pulls all @youngmuslims.com accounts from Google and adds any new ones to the database. Safe to run anytime — never overwrites existing data.
              </p>
            </div>
          </div>
          <SyncGoogleUsersButton />
        </div>
      </div>
    </>
  )
}
