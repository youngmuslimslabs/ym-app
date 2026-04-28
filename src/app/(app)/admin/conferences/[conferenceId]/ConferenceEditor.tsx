'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  MapPin,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { ConferenceStatusBadge } from '../components/ConferenceStatusBadge'
import { TypeToConfirmDialog } from '../components/TypeToConfirmDialog'
import { deleteConference, publishConference } from '../actions'
import { ConferenceInfoForm } from './components/ConferenceInfoForm'
import { ScheduleEditor } from './components/ScheduleEditor'
import { AttendeePicker } from './components/AttendeePicker'
import { FeedbackPlaceholder } from './components/FeedbackPlaceholder'
import type { ConferenceEditorView } from '../types'

interface Props {
  initialView: ConferenceEditorView
}

export function ConferenceEditor({ initialView }: Props) {
  const router = useRouter()
  const { conference, invitedCount, feedbackCount } = initialView
  const isDraft = conference.status === 'draft'

  const [publishPending, setPublishPending] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  async function handlePublish() {
    if (publishPending) return
    setPublishPending(true)
    try {
      const result = await publishConference(conference.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not publish')
        return
      }
      toast.success('Conference published')
      setPublishOpen(false)
      router.refresh()
    } finally {
      setPublishPending(false)
    }
  }

  async function handleDelete() {
    if (deletePending) return
    setDeletePending(true)
    try {
      const result = await deleteConference(conference.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not delete')
        return
      }
      toast.success('Conference deleted')
      router.push('/admin/conferences')
      router.refresh()
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <div>
      <header className="px-6 md:px-8 pt-10 md:pt-12 pb-5 border-b">
        <Link
          href="/admin/conferences"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-3"
        >
          <ChevronLeft className="w-3 h-3" />
          All conferences
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {conference.name}
              </h1>
              <ConferenceStatusBadge
                status={conference.status}
                start_date={conference.start_date}
                end_date={conference.end_date}
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
              {conference.location && (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {conference.location}
                  </span>
                  <span>·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                {formatHeaderDateRange(
                  conference.start_date,
                  conference.end_date
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDraft && (
              <Button
                onClick={() => setPublishOpen(true)}
                disabled={publishPending}
              >
                {publishPending ? 'Publishing…' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <Tabs
        defaultValue={isDraft ? 'schedule' : 'info'}
        className="px-6 md:px-8 pt-6"
      >
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees
            <span className="ml-1.5 text-muted-foreground tabular-nums">
              {invitedCount}
            </span>
          </TabsTrigger>
          {/* Feedback tab is intentionally available even when empty so admins
              can find it; it shows an empty state until the first response. */}
          <TabsTrigger value="feedback">
            Feedback
            {feedbackCount > 0 && (
              <span className="ml-1.5 text-muted-foreground tabular-nums">
                {feedbackCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="py-6">
          <ConferenceInfoForm
            conference={conference}
            onDeleteClick={() => setDeleteOpen(true)}
          />
        </TabsContent>
        <TabsContent value="schedule" className="py-6">
          <ScheduleEditor view={initialView} />
        </TabsContent>
        <TabsContent value="attendees" className="py-6">
          <AttendeePicker
            conferenceId={conference.id}
            people={initialView.attendees.people}
            filterCategories={initialView.attendees.filterCategories}
            invitedUserIds={initialView.attendees.invitedUserIds}
          />
        </TabsContent>
        <TabsContent value="feedback" className="py-6">
          <FeedbackPlaceholder feedbackCount={feedbackCount} />
        </TabsContent>
      </Tabs>

      <TypeToConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this conference?"
        description={
          <>
            Permanently removes{' '}
            <span className="text-foreground font-medium">
              {conference.name}
            </span>
            , {initialView.sessions.length}{' '}
            {initialView.sessions.length === 1 ? 'session' : 'sessions'},{' '}
            {invitedCount} attendee{' '}
            {invitedCount === 1 ? 'invitation' : 'invitations'}, and all
            signups, check-ins, and feedback. This cannot be undone.
          </>
        }
        confirmText={conference.name}
        confirmLabel="Delete conference"
        pendingLabel="Deleting…"
        tone="destructive"
        pending={deletePending}
        onConfirm={handleDelete}
      />

      <TypeToConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish this conference?"
        description={
          <>
            Once published,{' '}
            <span className="text-foreground font-medium">
              {conference.name}
            </span>{' '}
            becomes visible to all {invitedCount} invited attendee
            {invitedCount === 1 ? '' : 's'}. Publishing is one-way — you
            cannot revert to draft.
          </>
        }
        confirmText={conference.name}
        confirmLabel="Publish conference"
        pendingLabel="Publishing…"
        tone="primary"
        pending={publishPending}
        onConfirm={handlePublish}
      />
    </div>
  )
}

function formatHeaderDateRange(startISO: string, endISO: string): string {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  if (startISO === endISO) return format(start, 'MMMM d, yyyy')
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMMM d')}–${format(end, 'd, yyyy')}`
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}
