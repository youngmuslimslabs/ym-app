import { AdminPageSkeleton } from '../components/AdminPageSkeleton'

/** Loading UI for the admin conference list. Shown while the server component loads. */
export default function AdminConferencesLoading() {
  return <AdminPageSkeleton rows={4} />
}
