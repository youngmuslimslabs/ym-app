'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRef, useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  MapPin,
  Plus,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ConferenceStatusBadge } from '../components/ConferenceStatusBadge'
import { TypeToConfirmDialog } from '../components/TypeToConfirmDialog'
import { deleteConference, publishConference } from '../client-actions'
import { ConferenceInfoForm } from './components/ConferenceInfoForm'
import { ScheduleEditor, type ScheduleEditorHandle } from './components/ScheduleEditor'
import { AttendeePicker } from './components/AttendeePicker'
import { AdminFeedbackTab } from './components/AdminFeedbackTab'
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
  const [tab, setTab] = useState('schedule')
  const scheduleRef = useRef<ScheduleEditorHandle>(null)

  // Intercept tab changes so leaving the Schedule tab with an unsaved
  // session form triggers the same discard dialog as row clicks. The ref is
  // only populated while ScheduleEditor is mounted (i.e., while the schedule
  // tab is active), so it's null when switching from any other tab — in
  // which case there's nothing to guard.
  function handleTabChange(next: string) {
    if (next === tab) return
    const guard = scheduleRef.current?.attemptNav
    if (guard) guard(() => setTab(next))
    else setTab(next)
  }

  async function handlePublish() {
    if (publishPending) return
    setPublishPending(true)
    try {
      const result = await publishConference(conference.id)
      if (!result.success) {
        toast.error(result.error ?? 'Could not go live')
        return
      }
      toast.success('Conference is now live')
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
    // Lock to viewport on desktop so the schedule grid + tab scrollers stay
    // inside the viewport. Below md, fall back to natural document scroll —
    // AppShell renders a mobile header above us that would otherwise push
    // the bottom of the page off-screen.
    <div className="flex flex-col md:h-dvh md:overflow-hidden">
      <header className="px-6 md:px-8 pt-10 md:pt-12 pb-5 border-b shrink-0">
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
            <Button
              variant="outline"
              onClick={() => scheduleRef.current?.openCreate()}
            >
              <Plus className="w-4 h-4" />
              Add session
            </Button>
            {isDraft && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setPublishOpen(true)}
                      disabled={publishPending}
                    >
                      {publishPending ? 'Going live…' : 'Go Live'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] text-center">
                    Opens this conference to all invited attendees. This cannot be undone.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 md:px-8 pt-6 shrink-0">
          <TabsList>
            <TabsTrigger value="info">
              Info
            </TabsTrigger>
            <TabsTrigger value="schedule">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="attendees">
              Attendees
              <span className="ml-1.5 text-muted-foreground tabular-nums">
                {invitedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="feedback">
              Feedback
              {feedbackCount > 0 && (
                <span className="ml-1.5 text-muted-foreground tabular-nums">
                  {feedbackCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="py-6 px-6 md:px-8 overflow-y-auto flex-1 min-h-0 mt-0">
          <ConferenceInfoForm
            conference={conference}
            onDeleteClick={() => setDeleteOpen(true)}
          />
        </TabsContent>
        <TabsContent value="schedule" className="flex-1 min-h-0 mt-0">
          <ScheduleEditor ref={scheduleRef} view={initialView} />
        </TabsContent>
        <TabsContent value="attendees" className="py-6 px-6 md:px-8 overflow-y-auto flex-1 min-h-0 mt-0">
          <AttendeePicker
            conferenceId={conference.id}
            people={initialView.attendees.people}
            filterCategories={initialView.attendees.filterCategories}
            invitedUserIds={initialView.attendees.invitedUserIds}
          />
        </TabsContent>
        <TabsContent value="feedback" className="py-6 px-6 md:px-8 overflow-y-auto flex-1 min-h-0 mt-0">
          <AdminFeedbackTab
            sessions={initialView.sessions}
            feedbackBySession={initialView.feedbackBySession}
            timezone={conference.timezone}
            totalResponses={feedbackCount}
          />
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
        title="Go live with this conference?"
        description={
          <>
            Once live,{' '}
            <span className="text-foreground font-medium">
              {conference.name}
            </span>{' '}
            becomes visible to all {invitedCount} invited attendee
            {invitedCount === 1 ? '' : 's'}. Going live is one-way — you
            cannot revert to draft.
          </>
        }
        confirmText={conference.name}
        confirmLabel="Go live"
        pendingLabel="Going live…"
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
