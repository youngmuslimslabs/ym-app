'use client'

// Part-1 onboarding — the mandatory typeform. Middleware redirects users with
// onboarding_completed_at = null here. Reference data (subregions / NeighborNets
// / roles) comes from Supabase via OnboardingReferenceProvider (authenticated →
// real data). On completion, completePart1Onboarding persists everything and
// sets onboarding_completed_at, then routes into the app.

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { OnboardingFlow } from '@/components/onboarding-flow/OnboardingFlow'
import { completePart1Onboarding } from '@/lib/supabase/onboarding'
import {
  OnboardingReferenceProvider,
  useOnboardingReference,
} from '@/contexts/OnboardingReferenceContext'

function OnboardingContent() {
  const router = useRouter()
  const { subregions, neighborNets, roleTypes } = useOnboardingReference()
  const hasGeography = subregions.length > 0

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
      subregions={
        hasGeography ? subregions.map((s) => ({ value: s.id, label: s.name })) : undefined
      }
      neighborNetsFor={
        hasGeography
          ? (subregionId: string) =>
              neighborNets
                .filter((nn) => nn.subregion_id === subregionId)
                .map((nn) => ({ value: nn.id, label: nn.name }))
          : undefined
      }
      roles={
        roleTypes.length > 0
          ? roleTypes.map((rt) => ({ value: rt.id, label: rt.name }))
          : undefined
      }
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
