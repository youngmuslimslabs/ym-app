import { AdminPageSkeleton } from '../../components/AdminPageSkeleton'

/** Loading UI for the admin conference editor. Shown while the server component loads. */
export default function ConferenceEditorLoading() {
  return <AdminPageSkeleton rows={4} />
}
