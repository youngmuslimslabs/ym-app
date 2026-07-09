'use client'

import { ChevronLeft, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatPhoneNumber, isValidPhone, isValidEmail } from '@/lib/validation'

import { useOnboardingFlow } from './useOnboardingFlow'
import { TextStep, SelectStep, ComboboxStep, DateStep, type SelectOption } from './steps'

// NOTE: static option lists for the auth-free preview. At DB-integration time these
// come from Supabase (subregions/neighbor_nets/role_types tables). Ethnicity becomes
// the shared Nationality list + soft-suggestion combobox — see docs/project-todos.md.
const ETHNICITIES: SelectOption[] = [
  'Arab', 'South Asian', 'Black / African American', 'White', 'Hispanic / Latino',
  'East Asian', 'Southeast Asian', 'Persian', 'Turkish', 'Mixed', 'Other',
].map((v) => ({ value: v, label: v }))

const SUBREGIONS: SelectOption[] = ['Houston', 'Dallas', 'Austin', 'DMV', 'Bay Area'].map(
  (v) => ({ value: v, label: v }),
)

const NEIGHBORNETS: Record<string, string[]> = {
  Houston: ['Katy', 'Sugar Land', 'Downtown', 'Pearland'],
  Dallas: ['Plano', 'Irving', 'Richardson'],
  Austin: ['North Austin', 'Round Rock'],
  DMV: ['Northern Virginia', 'Maryland', 'DC'],
  'Bay Area': ['South Bay', 'East Bay', 'Peninsula'],
}
const asOptions = (labels: string[] = []): SelectOption[] =>
  labels.map((v) => ({ value: v, label: v }))

// Real role_types (name, by sort_order) from the DB, hardcoded here only for the
// auth-free preview; the live flow fetches these from Supabase at DB-integration.
const ROLES: SelectOption[] = [
  'NeighborNet Coordinator', 'Core Team Member', 'Sub-Regional Coordinator',
  'Sub-Regional Secretary General', 'Regional Coordinator', 'Regional Cloud Rep',
  'Regional Special Projects', 'Cloud Coordinator', 'Cloud Member', 'Cabinet Chair',
  'Cabinet Secretary General', 'Cabinet Department Head', 'Cabinet Team Lead',
  'Cabinet Team Member', 'National Coordinator', 'NS Secretary General',
  'Council Coordinator', 'National Cloud Rep', 'NS Member', 'Event Admin',
].map((v) => ({ value: v, label: v }))

const STEPS = [
  'phone', 'email', 'ethnicity', 'dob', 'subregion', 'neighbornet', 'role', 'done',
]

// DOB range mirrors the original onboarding's DatePicker (1940 … today − 10y).
const DOB_FROM_YEAR = 1940
const DOB_TO_YEAR = new Date().getFullYear() - 10

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
          format={formatPhoneNumber}
          validate={isValidPhone}
          errorMessage="Please enter a valid 10-digit phone number"
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
          validate={isValidEmail}
          errorMessage="Please enter a valid email address"
        />
      )
      break
    case 'ethnicity':
      content = (
        <ComboboxStep
          label="How do you identify?"
          options={ETHNICITIES}
          value={val('ethnicity')}
          placeholder="Select your ethnicity"
          searchPlaceholder="Search…"
          onSelect={(v) => choose('ethnicity', v)}
          onNext={flow.next}
        />
      )
      break
    case 'dob':
      content = (
        <DateStep
          label="Your date of birth"
          value={flow.answers.dob as Date | undefined}
          onChange={(d) => flow.setAnswer('dob', d)}
          onNext={flow.next}
          fromYear={DOB_FROM_YEAR}
          toYear={DOB_TO_YEAR}
        />
      )
      break
    case 'subregion':
      content = (
        <SelectStep
          label="Which subregion are you in?"
          options={SUBREGIONS}
          value={val('subregion')}
          placeholder="Select your subregion"
          onSelect={(v) => {
            // reset dependent neighbornet when subregion changes
            if (v !== val('subregion')) set('neighbornet', '')
            choose('subregion', v)
          }}
          onNext={flow.next}
        />
      )
      break
    case 'neighbornet':
      content = (
        <SelectStep
          label="And your NeighborNet?"
          options={asOptions(NEIGHBORNETS[val('subregion')])}
          value={val('neighbornet')}
          placeholder="Select your NeighborNet"
          onSelect={(v) => choose('neighbornet', v)}
          onNext={flow.next}
        />
      )
      break
    case 'role':
      content = (
        <SelectStep
          label="Your current role"
          help="Just your current title — you'll add your full history later."
          options={ROLES}
          value={val('role')}
          placeholder="Select your current role"
          onSelect={(v) => choose('role', v)}
          onNext={flow.next}
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
