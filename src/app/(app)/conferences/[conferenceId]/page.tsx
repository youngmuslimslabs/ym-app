import { notFound } from 'next/navigation'
import { getConferenceScheduleData } from './data'
import { ScheduleContent } from './ScheduleContent'

interface PageProps {
  params: Promise<{ conferenceId: string }>
}

export default async function ConferenceSchedulePage({ params }: PageProps) {
  const { conferenceId } = await params
  const data = await getConferenceScheduleData(conferenceId)

  if (!data) {
    notFound()
  }

  return <ScheduleContent initialView={data} />
}
