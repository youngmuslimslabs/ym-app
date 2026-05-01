import { Calendar } from 'lucide-react'
import { AdminConferencesTable } from './components/AdminConferencesTable'
import { ConferenceCreateDialog } from './components/ConferenceCreateDialog'
import { isActiveConference } from './lib/lifecycle'
import { getAdminConferenceList, requireAdmin } from './data'

export const dynamic = 'force-dynamic'

export default async function AdminConferencesPage() {
  await requireAdmin()
  const conferences = await getAdminConferenceList()

  const active = conferences.filter((c) => isActiveConference(c))
  const past = conferences.filter((c) => !isActiveConference(c))

  return (
    <>
      <div className="px-6 md:px-8 pt-10 md:pt-12 pb-6 border-b flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Event Administration
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Conferences
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage schedules, attendees, and rosters.
          </p>
        </div>
        <ConferenceCreateDialog />
      </div>

      <div className="px-6 md:px-8 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-medium mb-3">Active</h2>
          {active.length > 0 ? (
            <AdminConferencesTable rows={active} />
          ) : (
            <ActiveEmptyState />
          )}
        </section>
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-medium mb-3">Past</h2>
            <AdminConferencesTable rows={past} />
          </section>
        )}
      </div>
    </>
  )
}

function ActiveEmptyState() {
  return (
    <div className="rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Calendar className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">
        No active conferences
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        Create a conference to set up a schedule, invite attendees, and manage
        check-ins.
      </p>
    </div>
  )
}
