import { redirect } from 'next/navigation'
import { Users, DollarSign, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fetchUserContext, fetchHomeStats } from '@/lib/supabase/queries'
import {
  Greeting,
  QuickActionList,
  StatsStrip,
  ConferenceAttendanceSection,
} from '@/components/home'

const QUICK_ACTIONS = [
  { href: '/people', icon: Users, title: 'People', description: 'Browse YM members' },
  { href: '/finance', icon: DollarSign, title: 'Finance', description: 'Reimbursements' },
  { href: '/docs', icon: FileText, title: 'Docs', description: 'Halaqa & SOPs' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const [userContext, stats] = await Promise.all([
    fetchUserContext(session.user.id),
    fetchHomeStats(),
  ])

  const displayName = userContext?.name || session.user.email?.split('@')[0] || 'Member'
  const displayRoles = userContext?.roles ?? []
  const displayNN = userContext?.neighborNetName || 'No NeighborNet'
  const displaySR = userContext?.subregionName || ''

  return (
    <div className="px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto flex max-w-[600px] flex-col">
        <Greeting fullName={displayName} />

        <ConferenceAttendanceSection userId={session.user.id} />

        <hr className="mt-12 mb-14 border-t border-border" />

        <section className="space-y-1">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Who you are
          </div>
          <p className="text-[1.0625rem] font-medium leading-[1.4]">
            {displayRoles.length > 0 ? displayRoles.join(' · ') : 'No roles yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {displayNN}{displaySR && ` · ${displaySR}`}
          </p>
        </section>

        <section className="mt-14">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Quick actions
          </div>
          <QuickActionList actions={QUICK_ACTIONS} />
        </section>

        <section className="mt-14">
          <div className="mb-5 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            At a glance
          </div>
          <StatsStrip
            stats={[
              {
                label: 'Active members',
                value: stats.activeMembers,
                meta: 'this month',
                metaAccent: stats.newThisWeek > 0 ? `+${stats.newThisWeek}` : undefined,
              },
              {
                label: 'NeighborNets',
                value: stats.neighborNets,
                meta: stats.neighborNets === 1 ? 'across the network' : undefined,
              },
              {
                label: 'New this week',
                value: stats.newThisWeek,
                meta: stats.newThisWeek > 0 ? 'welcome them' : '—',
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
