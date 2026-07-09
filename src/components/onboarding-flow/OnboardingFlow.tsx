'use client'

import { ChevronLeft, UserRoundPen, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { useOnboardingFlow } from './useOnboardingFlow'
import { TextStep, ChoiceStep, DateStep, type ChoiceOption } from './steps'

// NOTE: static option lists for the auth-free preview. At DB-integration time these
// come from Supabase (ethnicity const + subregions/neighbor_nets/role_types tables).
const ETHNICITIES: ChoiceOption[] = [
  'Arab', 'South Asian', 'Black / African American', 'White', 'Hispanic / Latino',
  'East Asian', 'Southeast Asian', 'Persian', 'Turkish', 'Mixed', 'Other',
].map((v) => ({ value: v, label: v }))

const SUBREGIONS: ChoiceOption[] = ['Houston', 'Dallas', 'Austin', 'DMV', 'Bay Area'].map(
  (v) => ({ value: v, label: v }),
)

const NEIGHBORNETS: Record<string, string[]> = {
  Houston: ['Katy', 'Sugar Land', 'Downtown', 'Pearland'],
  Dallas: ['Plano', 'Irving', 'Richardson'],
  Austin: ['North Austin', 'Round Rock'],
  DMV: ['Northern Virginia', 'Maryland', 'DC'],
  'Bay Area': ['South Bay', 'East Bay', 'Peninsula'],
}
const asOptions = (labels: string[] = []): ChoiceOption[] =>
  labels.map((v) => ({ value: v, label: v }))

const ROLES: ChoiceOption[] = [
  'Amir', 'Naib Amir', 'Muhtamim Tarbiyah', 'Muhtamim Talim', 'Secretary', 'General Body Member',
].map((v) => ({ value: v, label: v }))

const STEPS = [
  'welcome', 'phone', 'email', 'ethnicity', 'dob', 'subregion', 'neighbornet', 'role', 'done',
]

export function OnboardingFlow({
  onComplete,
}: {
  onComplete?: (answers: Record<string, unknown>) => void
}) {
  const flow = useOnboardingFlow(STEPS)
  const val = (id: string) => (flow.answers[id] as string) ?? ''
  const set = (id: string, v: string) => flow.setAnswer(id, v)
  const choose = (id: string, v: string) => {
    set(id, v)
    flow.next()
  }

  const progress = Math.round((flow.index / (STEPS.length - 1)) * 100)
  const showBack = !flow.isFirst && flow.stepId !== 'done'

  let content: React.ReactNode = null
  switch (flow.stepId) {
    case 'welcome':
      content = (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <UserRoundPen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">
            Let&rsquo;s set up your profile
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            A few quick questions so we can place you in your NeighborNet and add you to the
            directory. About a minute.
          </p>
          <Button size="lg" className="mt-2 w-full" onClick={flow.next}>
            Get started
          </Button>
        </div>
      )
      break
    case 'phone':
      content = (
        <TextStep
          label="What's your phone number?"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(555) 123-4567"
          value={val('phone')}
          onChange={(v) => set('phone', v)}
          onNext={flow.next}
        />
      )
      break
    case 'email':
      content = (
        <TextStep
          label="Your personal email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={val('email')}
          onChange={(v) => set('email', v)}
          onNext={flow.next}
        />
      )
      break
    case 'ethnicity':
      content = (
        <ChoiceStep
          label="How do you identify?"
          options={ETHNICITIES}
          selected={val('ethnicity')}
          onSelect={(v) => choose('ethnicity', v)}
        />
      )
      break
    case 'dob':
      content = (
        <DateStep
          label="Your date of birth"
          value={val('dob')}
          onChange={(v) => set('dob', v)}
          onNext={flow.next}
        />
      )
      break
    case 'subregion':
      content = (
        <ChoiceStep
          label="Which subregion are you in?"
          options={SUBREGIONS}
          selected={val('subregion')}
          onSelect={(v) => {
            // reset dependent neighbornet when subregion changes
            if (v !== val('subregion')) set('neighbornet', '')
            choose('subregion', v)
          }}
        />
      )
      break
    case 'neighbornet':
      content = (
        <ChoiceStep
          label="And your NeighborNet?"
          options={asOptions(NEIGHBORNETS[val('subregion')])}
          selected={val('neighbornet')}
          onSelect={(v) => choose('neighbornet', v)}
        />
      )
      break
    case 'role':
      content = (
        <ChoiceStep
          label="Your current role"
          help="Just your current title — you'll add your full history later."
          options={ROLES}
          selected={val('role')}
          onSelect={(v) => choose('role', v)}
        />
      )
      break
    case 'done':
      content = (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">You&rsquo;re in!</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            You&rsquo;re set up and added to the directory. You can round out the rest of your
            profile any time.
          </p>
          <Button size="lg" className="mt-2 w-full" onClick={() => onComplete?.(flow.answers)}>
            Enter the app
          </Button>
        </div>
      )
      break
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5">
      <div className="pt-6">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {showBack && (
        <button
          type="button"
          onClick={flow.back}
          className="mt-4 -ml-1 flex w-fit items-center gap-1 rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      <div className="flex flex-1 flex-col justify-center py-8">{content}</div>
    </div>
  )
}
