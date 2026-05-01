import { createClient } from '@/lib/supabase/server'

export interface HomeStats {
  activeMembers: number
  newThisWeek: number
  neighborNets: number
}

/**
 * Fetch the three counts shown in /home's StatsStrip:
 * - activeMembers: users who have ever logged in (claimed_at IS NOT NULL)
 * - newThisWeek: users who claimed their account in the last 7 days
 * - neighborNets: total NeighborNet rows
 *
 * "Active" maps to `claimed_at` (set on first auth) rather than just
 * created_at because the users table is bulk-populated via Google sync;
 * a user record can exist long before the human ever logs in. We count
 * the moment someone actually shows up.
 */
export async function fetchHomeStats(): Promise<HomeStats> {
  const supabase = await createClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  const [
    { count: activeMembers },
    { count: newThisWeek },
    { count: neighborNets },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('claimed_at', 'is', null),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('claimed_at', sevenDaysAgoIso),
    supabase
      .from('neighbor_nets')
      .select('*', { count: 'exact', head: true }),
  ])

  return {
    activeMembers: activeMembers ?? 0,
    newThisWeek: newThisWeek ?? 0,
    neighborNets: neighborNets ?? 0,
  }
}
