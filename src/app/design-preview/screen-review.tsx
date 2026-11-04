'use client'

import { useRef, useState } from 'react'
import { BrandScope } from '@/components/brand/brand-scope'
import { Button } from '@/components/ui/button'
import { LoginScreen } from '@/components/auth/YMLoginForm'
import { HomeScreen } from '@/components/home/HomeScreen'
import { ConferenceAttendanceCard } from '@/components/home/ConferenceAttendanceCard'
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton'
import { OnboardingFlow } from '@/components/onboarding-flow/OnboardingFlow'
import { AppShell } from '@/components/layout/app-shell'

const SCREENS = ['home', 'login', 'onboarding'] as const
const STATES = ['default', 'loading', 'error', 'empty', 'live', 'no-roles'] as const
const CONFERENCE = { conferenceId: 'sample', name: 'Houston Regional Conference', startDate: '2026-11-06', endDate: '2026-11-08', location: 'Houston, Texas', isLive: false }

/** Review-only sample data: no sign-in, database fetch, or persistence. */
export function ScreenReview({ initialScreen, initialState, showControls }: { initialScreen: string; initialState: string; showControls: boolean }) {
  const [screen, setScreen] = useState(initialScreen)
  const [state, setState] = useState(initialState)
  const attempts = useRef(0)
  return <BrandScope className="ym-revised-screen min-h-dvh">
    {showControls && <aside aria-label="Review controls" className="relative z-50 space-y-3 border-b bg-card p-4">
      <p className="text-sm font-semibold">Figma screen review · sample data</p>
      <div className="flex flex-wrap gap-2">{SCREENS.map(name => <Button key={name} variant={screen === name ? 'default' : 'outline'} aria-pressed={screen === name} onClick={() => { setScreen(name); setState('default'); attempts.current = 0 }} className="min-h-11 capitalize">{name}</Button>)}</div>
      {screen !== 'onboarding' && <div className="flex flex-wrap gap-2">{STATES.filter(name => screen === 'home' ? name !== 'error' : ['default', 'loading', 'error'].includes(name)).map(name => <Button key={name} variant="outline" aria-pressed={state === name} onClick={() => setState(name)} className="min-h-11 capitalize">{name}</Button>)}</div>}
      <p className="max-w-3xl text-xs text-muted-foreground">Login uses a sample button here; the real Login keeps Google’s control. Home retains existing navigation and available community metrics. Onboarding uses sample choices: the first final save fails; retry opens sample Home. No production data is changed.</p>
    </aside>}
    {screen === 'login' ? <LoginScreen error={state === 'error' ? 'Use your @youngmuslims.com Google account to continue.' : null}>
      <Button className="min-h-11 w-full rounded-[10px]" disabled={state === 'loading'} onClick={() => setState('error')}>Continue with Google</Button>
      {state === 'loading' && <p role="status" className="mt-2 text-sm">Signing in…</p>}
    </LoginScreen> : screen === 'onboarding' ? <OnboardingFlow key={screen} onComplete={async () => {
      await new Promise(resolve => setTimeout(resolve, 600))
      if (attempts.current++ === 0) return false
      setScreen('home')
      setState('default')
      return true
    }} /> : <AppShell>{state === 'loading' ? <HomePageSkeleton /> : <HomeScreen
      fullName="Aisha Ahmed"
      roles={state === 'no-roles' ? [] : ['NeighborNet Coordinator']}
      neighborNet={state === 'no-roles' ? null : 'Katy NeighborNet'} subregion="Houston Subregion"
      stats={{ activeMembers: 128, neighborNets: 9, newThisWeek: 6 }}
      attendance={<ConferenceAttendanceCard attendance={state === 'empty' ? null : { ...CONFERENCE, isLive: state === 'live' }} />}
    />}</AppShell>}
  </BrandScope>
}
