import { notFound } from 'next/navigation'
import { requireAdmin } from '../data'
import { getConferenceEditorView } from './data'
import { ConferenceEditor } from './ConferenceEditor'

interface PageProps {
  params: Promise<{ conferenceId: string }>
}

export const dynamic = 'force-dynamic'

export default async function ConferenceEditorPage({ params }: PageProps) {
  await requireAdmin()
  const { conferenceId } = await params
  const view = await getConferenceEditorView(conferenceId)
  if (!view) notFound()

  return <ConferenceEditor initialView={view} />
}
