import { notFound } from 'next/navigation'
import { getSide } from '@/lib/side-server'
import { getConferenceScheduleData } from './data'
import { ScheduleContent } from './ScheduleContent'

interface PageProps {
  params: Promise<{ conferenceId: string }>
}

export default async function ConferenceSchedulePage({ params }: PageProps) {
  const { conferenceId } = await params
  const [data, side] = await Promise.all([getConferenceScheduleData(conferenceId), getSide()])

  if (!data) {
    notFound()
  }

  return <ScheduleContent initialView={data} side={side} />
}
