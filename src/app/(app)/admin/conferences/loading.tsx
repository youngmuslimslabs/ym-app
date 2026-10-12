import { HeaderPageSkeleton } from '@/components/layout'

/** Loading UI for the admin conference list. Shown while the server component loads. */
export default function AdminConferencesLoading() {
  return <HeaderPageSkeleton rows={4} />
}
