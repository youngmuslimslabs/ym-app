'use client'

// Part-2 profile completion — the real, authenticated "finish setting up your
// profile" flow. Reached from the completion strip or a gated action button.
// Fetches the signed-in user's profile; on finish sets profile_completed_at,
// which clears the strip + lifts the feature gates.

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useProfileData } from '@/app/profile/hooks/useProfileData'
import { markProfileComplete } from '@/lib/supabase/queries/profile'
import { ProfileCompletion } from '@/components/profile-completion/ProfileCompletion'

export default function CompleteProfilePage() {
  const router = useRouter()
  const { profileData, isLoading, error } = useProfileData()

  if (isLoading || (!profileData && !error)) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg items-center justify-center px-5">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    )
  }

  if (error || !profileData) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-5 text-center">
        <p className="text-sm text-muted-foreground">
          {error ?? 'We couldn’t load your profile. Please try again.'}
        </p>
      </div>
    )
  }

  return (
    <ProfileCompletion
      initialData={profileData}
      onComplete={async () => {
        // Set the durable completion flag FIRST. If it fails, keep the user here
        // with a real error instead of sending them home still gated.
        const res = await markProfileComplete()
        if (!res.success) {
          toast.error(res.error ?? 'Could not finish setting up your profile. Please try again.')
          return false
        }
        router.push('/home')
        return true
      }}
      onExit={() => router.push('/home')}
    />
  )
}
