import { Calendar } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
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
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-16 pt-8 sm:px-10 sm:pt-12">
      <PageHeader
        eyebrow="Event Administration"
        title="Conferences"
        description="Create and manage schedules, attendees, and rosters."
        actions={<ConferenceCreateDialog />}
      />

      <section className="space-y-4">
        <h2 className="ym-h2">Active</h2>
        {active.length > 0 ? (
          <AdminConferencesTable rows={active} />
        ) : (
          <ActiveEmptyState />
        )}
      </section>
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="ym-h2">Past</h2>
          <AdminConferencesTable rows={past} />
        </section>
      )}
    </div>
  )
}

function ActiveEmptyState() {
  return (
    <div className="rounded-2xl border bg-card p-6 py-10 text-center">
      <div className="mx-auto mb-4 w-fit rounded-full bg-muted/50 p-4">
        <Calendar className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="ym-h3 mb-1.5">No active conferences</h3>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
        Create a conference to set up a schedule, invite attendees, and manage
        check-ins.
      </p>
    </div>
  )
}
