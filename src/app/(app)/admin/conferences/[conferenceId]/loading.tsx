import { HeaderPageSkeleton } from '@/components/layout'

/** Loading UI for the admin conference editor. Shown while the server component loads. */
export default function ConferenceEditorLoading() {
  return <HeaderPageSkeleton rows={6} />
}
