import type { ReactNode } from 'react'
import { Users, DollarSign, FileText } from 'lucide-react'
import { Greeting } from './Greeting'
import { HomeHero } from './HomeHero'
import { QuickActionList } from './QuickActionList'
import { StatsStrip } from './StatsStrip'

const QUICK_ACTIONS = [
  { href: '/people', icon: Users, title: 'People', description: 'Browse YM members' },
  { href: '/finance', icon: DollarSign, title: 'Finance', description: 'Reimbursements and requests' },
  { href: '/docs', icon: FileText, title: 'Docs', description: 'Halaqa guides and SOPs' },
]

interface HomeScreenProps {
  fullName: string
  roles: string[]
  neighborNet: string | null
  subregion: string | null
  stats: { activeMembers: number; neighborNets: number; newThisWeek: number }
  attendance: ReactNode
}

export function HomeScreen({ attendance, stats, ...identity }: HomeScreenProps) {
  return <div className="ym-revised-screen min-h-full bg-background px-4 py-6 pb-16 sm:px-8 sm:py-8">
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <Greeting fullName={identity.fullName} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {attendance}
        <HomeHero {...identity} />
      </div>
      <section className="space-y-3" aria-labelledby="home-actions"><h2 id="home-actions" className="text-lg font-medium">Quick actions</h2><QuickActionList actions={QUICK_ACTIONS} /></section>
      <section className="space-y-2" aria-labelledby="home-community"><h2 id="home-community" className="text-xs">Community at a glance</h2>
        <StatsStrip stats={[{ label: 'Active members', value: stats.activeMembers }, { label: 'NeighborNets', value: stats.neighborNets }, { label: 'New this week', value: stats.newThisWeek }]} />
      </section>
    </div>
  </div>
}
