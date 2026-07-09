'use client'

// PROTOTYPE-ONLY route: preview of the new Part-1 onboarding typeform for mobile
// testing (auth-exempt in middleware). The real cutover replaces /onboarding.
//
// Reference data (subregions / NeighborNets / roles) comes from Supabase via
// OnboardingReferenceProvider. Those tables are RLS-gated to authenticated users,
// so: logged in → real data; anonymous → the flow's hardcoded fallback lists.

import { useRouter } from 'next/navigation'

import { OnboardingFlow } from '@/components/onboarding-flow/OnboardingFlow'
import {
  OnboardingReferenceProvider,
  useOnboardingReference,
} from '@/contexts/OnboardingReferenceContext'

function OnboardingV2Flow() {
  const router = useRouter()
  const { subregions, neighborNets, roleTypes } = useOnboardingReference()

  // Only override the flow's fallback lists once real data has arrived (i.e. the
  // visitor is authenticated and RLS returned rows). Empty ⇒ leave props
  // undefined so the hardcoded preview lists show.
  const hasGeography = subregions.length > 0

  return (
    <OnboardingFlow
      onComplete={() => router.push('/home')}
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

export default function OnboardingV2PreviewPage() {
  return (
    <OnboardingReferenceProvider>
      <OnboardingV2Flow />
    </OnboardingReferenceProvider>
  )
}
