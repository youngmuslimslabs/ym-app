import { AdminPageSkeleton } from './components/AdminPageSkeleton'

/** Loading UI for admin tools. Shown while the server component loads. */
export default function AdminLoading() {
  return <AdminPageSkeleton rows={1} />
}
