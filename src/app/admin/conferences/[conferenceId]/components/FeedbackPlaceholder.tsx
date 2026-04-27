import { Star } from 'lucide-react'

// Stage 6 lights up the per-session ranked list + comment drilldown sheet.
// Until then, the tab shows an empty state — present only so admins know
// where it will land. Per the locked decision, the tab is always visible
// (not hidden until first response) so admins can find it.
interface Props {
  feedbackCount: number
}

export function FeedbackPlaceholder({ feedbackCount }: Props) {
  return (
    <div className="max-w-md mx-auto py-12 text-center">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Star className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">
        {feedbackCount > 0
          ? `${feedbackCount.toLocaleString()} ${feedbackCount === 1 ? 'response' : 'responses'} so far`
          : 'No feedback yet'}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        After sessions end, attendees can rate them and leave comments. A
        ranked-by-rating view lands in a later stage.
      </p>
    </div>
  )
}
