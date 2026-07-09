'use client'

// PROTOTYPE-ONLY: auth-free preview of the Part-2 completion hub (mock data).
// Real usage fetches the signed-in user's profile via useProfileData.

import { ProfileCompletion } from '@/components/profile-completion/ProfileCompletion'
import type { ProfileFormState } from '@/app/profile/hooks/useProfileForm'

const MOCK: ProfileFormState = {
  phoneNumber: '(555) 123-4567',
  personalEmail: 'me@example.com',
  ethnicity: 'Arab',
  dateOfBirth: new Date('2000-01-01'),
  neighborNetId: 'nn1',
}

export default function ProfileCompletionPreviewPage() {
  return <ProfileCompletion initialData={MOCK} onComplete={() => {}} />
}
