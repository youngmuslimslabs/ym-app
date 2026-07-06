'use client'

import { useState } from 'react'
import {
  CalendarCheck,
  FileText,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Greeting } from '@/components/home/Greeting'
import { QuickActionList } from '@/components/home/QuickActionList'
import { PersonCardGrid } from '@/app/(app)/people/components/PersonCardGrid'
import { SessionCard } from '@/app/(app)/conferences/[conferenceId]/components/SessionCard'
import type { PersonListItem } from '@/lib/supabase/queries/people'
import type { Session } from '@/app/(app)/conferences/[conferenceId]/types'
import { ProfileCompletionCard } from '@/components/profile-completion/ProfileCompletionCard'
import {
  PRESET_COMPLETE,
  PRESET_NEW,
  PRESET_PARTLY,
  ProfileCompletionProvider,
  useProfileCompletion,
  type CompletionSections,
} from '@/contexts/ProfileCompletionContext'

type PreviewTab = 'home' | 'people' | 'convention'

const TABS: { id: PreviewTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'people', label: 'People' },
  { id: 'convention', label: 'Convention' },
]

const QUICK_ACTIONS: { href: string; icon: LucideIcon; title: string; description: string }[] = [
  { href: '#', icon: Users, title: 'People', description: 'Browse the member directory' },
  { href: '#', icon: CalendarCheck, title: 'Convention', description: 'View the schedule and check in' },
  { href: '#', icon: Wallet, title: 'Finance', description: 'Submit a reimbursement request' },
  { href: '#', icon: FileText, title: 'Docs', description: 'Handbooks and resources' },
]

const MOCK_PEOPLE: PersonListItem[] = [
  {
    id: '1',
    firstName: 'Aisha',
    lastName: 'Karim',
    email: 'aisha.karim@youngmuslims.com',
    region: { id: 'r1', name: 'Texas' },
    subregion: { id: 's1', name: 'Houston' },
    neighborNet: { id: 'n1', name: 'Katy' },
    roles: [{ id: 'ro1', name: 'Naib Amir', category: 'subregional' }],
    skills: ['Public Speaking', 'Mentorship', 'Event Planning'],
    isClaimed: true,
  },
  {
    id: '2',
    firstName: 'Bilal',
    lastName: 'Ahmed',
    email: 'bilal.ahmed@youngmuslims.com',
    region: { id: 'r1', name: 'Texas' },
    subregion: { id: 's1', name: 'Houston' },
    neighborNet: { id: 'n2', name: 'Sugar Land' },
    roles: [{ id: 'ro2', name: 'Muhtamim Talim', category: 'cabinet' }],
    skills: ['Teaching', 'Arabic', 'Writing'],
    isClaimed: true,
  },
  {
    id: '3',
    firstName: 'Sara',
    lastName: 'Malik',
    email: 'sara.malik@youngmuslims.com',
    region: { id: 'r2', name: 'DMV' },
    subregion: { id: 's2', name: 'Northern Virginia' },
    neighborNet: { id: 'n3', name: 'Fairfax' },
    roles: [{ id: 'ro3', name: 'Regional Coordinator', category: 'regional' }],
    skills: ['Operations', 'Recruiting', 'Data/Analytics'],
    isClaimed: true,
  },
  {
    id: '4',
    firstName: 'Omar',
    lastName: 'Farouk',
    email: 'omar.farouk@youngmuslims.com',
    region: { id: 'r3', name: 'West' },
    subregion: { id: 's3', name: 'Bay Area' },
    neighborNet: { id: 'n4', name: 'Fremont' },
    roles: [{ id: 'ro4', name: 'General Body Member', category: 'neighbor_net' }],
    skills: ['Programming', 'Video Editing', 'Social Media'],
    isClaimed: true,
  },
  {
    id: '5',
    firstName: 'Zainab',
    lastName: 'Hassan',
    email: 'zainab.hassan@youngmuslims.com',
    region: { id: 'r1', name: 'Texas' },
    subregion: { id: 's4', name: 'Dallas' },
    neighborNet: { id: 'n5', name: 'Plano' },
    roles: [{ id: 'ro5', name: 'Amir', category: 'ns' }],
    skills: ['Leadership', 'Fundraising', 'Counseling'],
    isClaimed: true,
  },
  {
    id: '6',
    firstName: 'Yusuf',
    lastName: 'Rahman',
    email: 'yusuf.rahman@youngmuslims.com',
    region: { id: 'r2', name: 'DMV' },
    subregion: { id: 's5', name: 'Maryland' },
    neighborNet: { id: 'n6', name: 'Silver Spring' },
    roles: [{ id: 'ro6', name: 'Council Member', category: 'council' }],
    skills: ['Marketing', 'Photography', 'Graphic Design'],
    isClaimed: true,
  },
]

// Fixed clock well before the mock sessions, so every card reads as "upcoming"
// and its tap opens the gate (the star interaction).
const PREVIEW_NOW = new Date('2026-07-14T06:00:00-05:00')

const MOCK_SESSIONS: Session[] = [
  {
    id: 'ss1',
    conference_id: 'c1',
    start_at: '2026-07-14T14:00:00Z',
    end_at: '2026-07-14T15:00:00Z',
    title: 'Opening Keynote: Faith & Leadership',
    description:
      'Kick off the convention with a look at how young Muslims can lead with purpose in their communities.',
    speaker: 'Sh. Omar Suleiman',
    room: 'Main Hall',
    is_break: false,
    capacity: 400,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'ss2',
    conference_id: 'c1',
    start_at: '2026-07-14T15:15:00Z',
    end_at: '2026-07-14T16:15:00Z',
    title: 'Building Your NeighborNet',
    description:
      'A practical workshop on organizing, growing, and sustaining a local NeighborNet chapter.',
    speaker: 'Br. Yusuf Ali',
    room: 'Room 201',
    is_break: false,
    capacity: 60,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'ss3',
    conference_id: 'c1',
    start_at: '2026-07-14T16:15:00Z',
    end_at: '2026-07-14T16:45:00Z',
    title: 'Asr & Coffee Break',
    description: null,
    speaker: null,
    room: 'Atrium',
    is_break: true,
    capacity: null,
    created_at: '',
    updated_at: '',
  },
  {
    id: 'ss4',
    conference_id: 'c1',
    start_at: '2026-07-14T16:45:00Z',
    end_at: '2026-07-14T17:45:00Z',
    title: 'Careers & Mentorship Panel',
    description:
      'Hear from professionals across fields on navigating career, faith, and community involvement.',
    speaker: 'Panel',
    room: 'Room 305',
    is_break: false,
    capacity: 120,
    created_at: '',
    updated_at: '',
  },
]

function DevControlBar() {
  const { applyPreset, completion } = useProfileCompletion()

  const presets: { label: string; sections: CompletionSections }[] = [
    { label: 'New · 33%', sections: PRESET_NEW },
    { label: 'Partly · 67%', sections: PRESET_PARTLY },
    { label: 'Complete · 100%', sections: PRESET_COMPLETE },
  ]

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/30 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Prototype controls — not part of the app
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const active = preset.sections === completion.sections
          return (
            <Button
              key={preset.label}
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => applyPreset(preset.sections)}
            >
              {preset.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function HomeTab() {
  return (
    <div className="flex flex-col gap-8">
      <ProfileCompletionCard />
      <Greeting fullName="Yusuf Rahman" />
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quick actions
        </h2>
        <QuickActionList actions={QUICK_ACTIONS} />
      </div>
    </div>
  )
}

function PeopleTab() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileCompletionCard />
      <div>
        <h2 className="mb-1 text-2xl font-semibold tracking-tight">People</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Browsing is always open — no gate here.
        </p>
        <PersonCardGrid people={MOCK_PEOPLE} />
      </div>
    </div>
  )
}

function ConventionTab() {
  const { isComplete, openGate } = useProfileCompletion()

  function handleCheckIn() {
    if (!isComplete) {
      openGate({ action: 'check in', requiredLabels: ['Your role', 'Your region'] })
      return
    }
    toast.success('Checked in')
  }

  function handleSessionSelect() {
    if (!isComplete) {
      openGate({
        action: 'RSVP to this session',
        requiredLabels: ['Your role', 'Your region'],
      })
      return
    }
    toast.success('Saved to your schedule')
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileCompletionCard />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          July 14, 2026
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">YM Convention 2026</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse the full schedule freely — check-in and RSVP ask you to finish
          your profile.
        </p>
      </div>

      <Button className="w-full" size="lg" onClick={handleCheckIn}>
        Check in
      </Button>

      <div className="flex flex-col gap-3">
        {MOCK_SESSIONS.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            signedUp={false}
            checkedIn={false}
            seatCount={40}
            now={PREVIEW_NOW}
            onSelect={handleSessionSelect}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewShell() {
  const [tab, setTab] = useState<PreviewTab>('convention')

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-5 py-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Profile-completion gating
          </h1>
          <p className="text-sm text-muted-foreground">
            One shared state driving a persistent progress card + a contextual gate.
          </p>
        </div>

        <DevControlBar />

        <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
          {TABS.map((t) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="pt-1">
          {tab === 'home' && <HomeTab />}
          {tab === 'people' && <PeopleTab />}
          {tab === 'convention' && <ConventionTab />}
        </div>
      </div>
    </div>
  )
}

export function GatingPreview() {
  return (
    <ProfileCompletionProvider>
      <PreviewShell />
    </ProfileCompletionProvider>
  )
}
