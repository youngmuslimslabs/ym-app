import { fetchUpcomingAttendance } from '@/lib/supabase/queries'
import { ConferenceAttendanceCard } from './ConferenceAttendanceCard'

export { formatConferenceDateRange, conferenceDateTile } from './conference-dates'

export async function ConferenceAttendanceSection() {
  const attendance = await fetchUpcomingAttendance()
  return <ConferenceAttendanceCard attendance={attendance} />
}
