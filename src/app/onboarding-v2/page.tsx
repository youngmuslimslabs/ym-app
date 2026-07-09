'use client'

// PROTOTYPE-ONLY route: preview of the new Part-1 onboarding typeform for mobile
// testing (auth-exempt in middleware). The real cutover replaces /onboarding.

import { useRouter } from 'next/navigation'

import { OnboardingFlow } from '@/components/onboarding-flow/OnboardingFlow'

export default function OnboardingV2PreviewPage() {
  const router = useRouter()
  return <OnboardingFlow onComplete={() => router.push('/home')} />
}
