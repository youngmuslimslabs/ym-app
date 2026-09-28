import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Users, DollarSign, FileText } from 'lucide-react'
import { getAuthUser } from '@/lib/supabase/current-user'
import { fetchUserContext, fetchHomeStats } from '@/lib/supabase/queries'
import {
  HomeHero,
  QuickActionList,
  StatsStrip,
  ConferenceAttendanceSection,
} from '@/components/home'

const QUICK_ACTIONS = [
  { href: '/people', icon: Users, title: 'People', description: 'Find your people across YM' },
  { href: '/finance', icon: DollarSign, title: 'Finance', description: 'Get reimbursed' },
  { href: '/docs', icon: FileText, title: 'Docs', description: 'Halaqa guides and SOPs' },
]

export default async function HomePage() {
  // All three share one cached auth check + users-row read (current-user.ts).
  const [user, userContext, stats] = await Promise.all([
    getAuthUser(),
    fetchUserContext(),
    fetchHomeStats(),
  ])

  if (!user) {
    redirect('/login/')
  }

  const displayName = userContext?.name || user.email?.split('@')[0] || 'Member'

  return (
    <div className="pb-16">
      <HomeHero
        fullName={displayName}
        roles={userContext?.roles ?? []}
        neighborNet={userContext?.neighborNetName || null}
        subregion={userContext?.subregionName || null}
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pt-10 sm:px-10">
        {/* Streams in after the rest of the page instead of blocking it. */}
        <Suspense fallback={null}>
          <ConferenceAttendanceSection />
        </Suspense>

        <section className="space-y-5">
          <h2 className="ym-h2">Jump back in</h2>
          <QuickActionList actions={QUICK_ACTIONS} />
        </section>

        <section className="space-y-5">
          <h2 className="ym-h2">Across the network</h2>
          <StatsStrip
            stats={[
              {
                label: 'Active members',
                value: stats.activeMembers,
                metaAccent: stats.newThisWeek > 0 ? `+${stats.newThisWeek}` : undefined,
              },
              {
                label: 'NeighborNets',
                value: stats.neighborNets,
              },
              {
                label: 'New this week',
                value: stats.newThisWeek,
                meta: stats.newThisWeek > 0 ? 'say salam' : undefined,
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
