import type { Metadata } from 'next'
import Link from 'next/link'
import { DollarSign, FileText, Users } from 'lucide-react'

import {
  ConferenceAttendanceCard,
  HomeHero,
  QuickActionList,
  StatsStrip,
} from '@/components/home'
import type { UpcomingAttendance } from '@/lib/supabase/queries/conferences'

export const metadata: Metadata = {
  title: 'New designs preview',
  robots: { index: false },
}

// Sample data only. This page reads nothing from the database, which is why it
// can be public and why it works on a Netlify preview where sign-in doesn't.
const QUICK_ACTIONS = [
  { href: '/design-preview', icon: Users, title: 'People', description: 'Find your people across YM' },
  { href: '/design-preview', icon: DollarSign, title: 'Finance', description: 'Get reimbursed' },
  { href: '/design-preview', icon: FileText, title: 'Docs', description: 'Halaqa guides and SOPs' },
]

const CONFERENCE: UpcomingAttendance = {
  conferenceId: 'sample',
  name: 'Fall Retreat 2026',
  startDate: '2026-11-06',
  endDate: '2026-11-08',
  location: 'Camp Tall Timbers',
  isLive: false,
}

const SIDES = [
  {
    side: 'brothers',
    label: 'Brothers',
    name: 'Yusuf',
    roles: ['Sub-Regional Coordinator', 'Event Admin'],
  },
  {
    side: 'sisters',
    label: 'Sisters',
    name: 'Maryam',
    roles: ['Cloud Member'],
  },
] as const

/**
 * The redesigned Home, rendered from sample data once per side, so the team can
 * review the new designs without signing in (preview URLs can't use Google
 * sign-in, #81). Each block is exactly what a member of that side would see.
 */
export default function DesignPreviewPage() {
  return (
    <div className="space-y-16 pb-24">
      <header className="mx-auto max-w-5xl space-y-3 px-4 pt-6 sm:px-6">
        <p className="ym-eyebrow text-muted-foreground">Preview · sample data</p>
        <h1 className="ym-h1">New designs</h1>
        <p className="max-w-2xl text-muted-foreground">
          The redesigned Home as a Brothers member and as a Sisters member, with made-up people
          and numbers. The sidebar beside this page is part of the redesign too. The{' '}
          <Link href="/login" className="underline underline-offset-4">
            login screen
          </Link>{' '}
          and the{' '}
          <Link href="/design-system" className="underline underline-offset-4">
            design system
          </Link>{' '}
          are live pages too. Resize the window, or open this on a phone, to check smaller screens.
        </p>
      </header>

      {SIDES.map(({ side, label, name, roles }) => (
        <section
          key={side}
          data-theme-side={side}
          aria-label={`${label} view`}
          className="bg-background pb-12 pt-6 text-foreground"
        >
          <p className="ym-eyebrow mx-auto max-w-5xl px-4 pb-2 text-muted-foreground sm:px-6">
            {label} view
          </p>
          <HomeHero
            fullName={name}
            roles={[...roles]}
            neighborNet="571"
            subregion="New Jersey South"
          />
          <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pt-10 sm:px-10">
            <ConferenceAttendanceCard attendance={CONFERENCE} />
            <div className="space-y-5">
              <h2 className="ym-h2">Jump back in</h2>
              <QuickActionList actions={QUICK_ACTIONS} />
            </div>
            <div className="space-y-5">
              <h2 className="ym-h2">Across the network</h2>
              <StatsStrip
                stats={[
                  { label: 'Active members', value: 1284, metaAccent: '+17' },
                  { label: 'NeighborNets', value: 96 },
                  { label: 'New this week', value: 17, meta: 'say salam' },
                ]}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
