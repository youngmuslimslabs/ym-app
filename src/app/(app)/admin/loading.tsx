import { HeaderPageSkeleton } from '@/components/layout'

/** Loading UI for admin tools. Shown while the server component loads. */
export default function AdminLoading() {
  return <HeaderPageSkeleton rows={1} />
}
