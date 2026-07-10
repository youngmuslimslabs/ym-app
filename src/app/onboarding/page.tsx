'use client'

// Part-1 onboarding — the mandatory typeform. Middleware redirects users with
// onboarding_completed_at = null here. Reference data (subregions / NeighborNets
// / roles) comes from Supabase via OnboardingReferenceProvider (authenticated →
// real data). On completion, completePart1Onboarding persists everything and
// sets onboarding_completed_at, then routes into the app.

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { OnboardingFlow } from '@/components/onboarding-flow/OnboardingFlow'
import { completePart1Onboarding } from '@/lib/supabase/onboarding'
import {
  OnboardingReferenceProvider,
  useOnboardingReference,
} from '@/contexts/OnboardingReferenceContext'

function OnboardingContent() {
  const router = useRouter()
  const { subregions, neighborNets, roleTypes, isLoading, error } = useOnboardingReference()

  // The authenticated flow MUST render with real DB options, whose values are
  // UUIDs. We never fall through to OnboardingFlow's hardcoded, name-valued
  // preview lists here — a completed answer would then write a non-UUID string
  // into a FK column and the save would fail, leaving onboarding uncompletable.
  const hasReferenceData = subregions.length > 0 && roleTypes.length > 0

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center px-5">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (error || !hasReferenceData) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? 'We couldn’t load the setup options. Please try again.'}
        </p>
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  return (
    <OnboardingFlow
      onComplete={async (answers) => {
        const result = await completePart1Onboarding({
          phone: answers.phone as string | undefined,
          email: answers.email as string | undefined,
          ethnicity: answers.ethnicity as string | undefined,
          dob: answers.dob as Date | undefined,
          neighbornet: answers.neighbornet as string | undefined,
          role: answers.role as string | undefined,
        })
        if (!result.success) {
          toast.error(result.error ?? 'Could not save your info. Please try again.')
          return
        }
        router.push('/home')
      }}
      subregions={subregions.map((s) => ({ value: s.id, label: s.name }))}
      neighborNetsFor={(subregionId: string) =>
        neighborNets
          .filter((nn) => nn.subregion_id === subregionId)
          .map((nn) => ({ value: nn.id, label: nn.name }))
      }
      roles={roleTypes.map((rt) => ({ value: rt.id, label: rt.name }))}
    />
  )
}

export default function OnboardingPage() {
  return (
    <OnboardingReferenceProvider>
      <OnboardingContent />
    </OnboardingReferenceProvider>
  )
}
