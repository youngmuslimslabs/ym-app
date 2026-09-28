import { HeaderPageSkeleton } from '@/components/layout'

/** Loading UI for a conference schedule. Shown while the server component loads. */
export default function ConferenceScheduleLoading() {
  return <HeaderPageSkeleton rows={6} />
}
