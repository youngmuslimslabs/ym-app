import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/current-user'
import { fetchUserContext, fetchHomeStats } from '@/lib/supabase/queries'
import { HomeScreen } from '@/components/home/HomeScreen'
import { ConferenceAttendanceSection } from '@/components/home/ConferenceAttendanceSection'
import { AttendanceSkeleton } from '@/components/home/HomePageSkeleton'

export default async function HomePage() {
  const [user, userContext, stats] = await Promise.all([getAuthUser(), fetchUserContext(), fetchHomeStats()])
  if (!user) redirect('/login/')
  return <HomeScreen
    fullName={userContext?.name || user.email?.split('@')[0] || 'Member'}
    roles={userContext?.roles ?? []}
    neighborNet={userContext?.neighborNetName || null}
    subregion={userContext?.subregionName || null}
    stats={stats}
    attendance={<Suspense fallback={<AttendanceSkeleton />}><ConferenceAttendanceSection /></Suspense>}
  />
}
