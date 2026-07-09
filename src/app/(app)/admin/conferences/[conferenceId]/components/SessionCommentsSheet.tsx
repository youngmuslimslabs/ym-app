'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useBottomSheetDragToDismiss } from '@/hooks/use-bottom-sheet-drag'
import { createClient } from '@/lib/supabase/client'
import { resolveEmbeddedName, type EmbeddedUserName } from '@/lib/name'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { decomposeTzIso } from '../../lib/datetime'
import type { AdminSession } from '../../types'

interface Props {
  session: AdminSession | null
  timezone: string
  onClose: () => void
}

interface CommentRow {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  authorName: string
}

// Drill-down for one session's feedback. Read-only — admin cannot edit. Loaded
// once per open via the browser Supabase client (RLS lets admins read all
// session_feedback rows). Author names resolve at the query layer through the
// embedded users(first_name, last_name) — never a second client-side lookup.
export function SessionCommentsSheet({ session, timezone, onClose }: Props) {
  const isMobile = useIsMobile()
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { sheetRef, dragHandleProps } = useBottomSheetDragToDismiss({
    onDismiss: onClose,
  })

  useEffect(() => {
    if (!session) return
    setComments(null)
    setError(null)
    let cancelled = false
    void loadComments(session.id).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setComments(res.comments)
    })
    return () => {
      cancelled = true
    }
  }, [session])

  if (!session) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && onClose()}>
        <SheetContent />
      </Sheet>
    )
  }

  const startWall = decomposeTzIso(session.start_at, timezone)
  const side = isMobile ? 'bottom' : 'right'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={isMobile ? sheetRef : undefined}
        side={side}
        className={cn(
          'flex flex-col p-0 gap-0',
          isMobile
            ? 'h-auto max-h-[90vh] rounded-t-xl'
            : 'w-full sm:max-w-lg'
        )}
      >
        {isMobile && (
          <div
            className="flex justify-center pt-2 pb-1 shrink-0 touch-none"
            {...dragHandleProps}
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}

        <SheetHeader className="p-6 border-b text-left space-y-2">
          <div className="text-xs uppercase tracking-widest text-primary font-medium">
            Feedback
          </div>
          <SheetTitle className="text-xl font-semibold tracking-tight pr-8">
            {session.title}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {formatDateLabel(startWall.date)} · {formatTime(startWall.time)}
            {session.speaker ? ` · ${session.speaker}` : ''}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <ErrorState message={error} />
          ) : comments === null ? (
            <LoadingState />
          ) : comments.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y">
              {comments.map((c) => (
                <CommentRowView key={c.id} comment={c} />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CommentRowView({ comment }: { comment: CommentRow }) {
  return (
    <li className="px-6 py-4 space-y-2">
      <div className="flex items-center gap-3">
        <RatingStars rating={comment.rating} />
        <span className="text-xs text-muted-foreground">·</span>
        <div className="text-sm font-medium truncate flex-1 min-w-0">
          {comment.authorName}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums shrink-0">
          {formatRelativeDate(comment.createdAt)}
        </div>
      </div>
      {comment.comment ? (
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {comment.comment}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Rating only — no comment.
        </p>
      )}
    </li>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'w-3.5 h-3.5',
            n <= rating
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="px-6 py-12 text-center text-sm text-muted-foreground">
      Loading feedback…
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="max-w-xs mx-auto py-12 text-center px-6">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <MessageSquare className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight mb-1">
        No responses yet
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Once attendees rate this session, their feedback shows up here.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dateObj = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = ((h + 11) % 12) + 1
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}

// "2h ago", "3d ago", or fall back to a date for anything older than a week.
// Lets admins eyeball a freshness ordering without scanning timestamps.
function formatRelativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

async function loadComments(
  sessionId: string
): Promise<{ comments: CommentRow[]; error: null } | { comments: []; error: string }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('session_feedback')
    .select('id, rating, comment, created_at, users(first_name, last_name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) return { comments: [], error: error.message }

  type FeedbackRow = {
    id: string
    rating: number
    comment: string | null
    created_at: string
    users: EmbeddedUserName | EmbeddedUserName[] | null
  }
  const comments: CommentRow[] = ((data ?? []) as FeedbackRow[]).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    authorName: resolveEmbeddedName(row.users),
  }))

  return { comments, error: null }
}
