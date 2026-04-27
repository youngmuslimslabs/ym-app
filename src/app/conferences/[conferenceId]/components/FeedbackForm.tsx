'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  // Existing feedback if the user has already rated; toggles "edit mode" copy
  // and pre-fills inputs.
  existing: { rating: number; comment: string | null } | null
  pending: boolean
  onSubmit: (rating: number, comment: string) => Promise<void>
}

export function FeedbackForm({ existing, pending, onSubmit }: Props) {
  const [rating, setRating] = useState<number>(existing?.rating ?? 0)
  const [hover, setHover] = useState<number>(0)
  const [comment, setComment] = useState<string>(existing?.comment ?? '')

  // Resync if the parent flips between two sessions while sheet is open, or
  // if existing feedback updates after a successful submit.
  useEffect(() => {
    setRating(existing?.rating ?? 0)
    setComment(existing?.comment ?? '')
  }, [existing?.rating, existing?.comment])

  const isEdit = existing !== null
  const canSubmit =
    rating > 0 &&
    !pending &&
    // In edit mode, only enable the button if something changed.
    (!isEdit ||
      rating !== existing.rating ||
      (comment.trim() || null) !== (existing.comment ?? null))

  // Hover preview only kicks in before any rating is committed. After commit,
  // hover does nothing so the user's choice doesn't appear to change under the
  // cursor as they read the form.
  const previewActive = rating === 0

  return (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium mb-3 block">How was it?</label>
        <div
          className="flex gap-2"
          onMouseLeave={() => previewActive && setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = previewActive ? hover >= n : rating >= n
            return (
              <button
                key={n}
                type="button"
                disabled={pending}
                onClick={() => setRating(n)}
                onMouseEnter={() => previewActive && setHover(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                aria-pressed={rating === n}
                className={cn(
                  'h-11 w-11 rounded-md flex items-center justify-center transition-colors disabled:opacity-50',
                  filled
                    ? 'border border-primary bg-primary text-primary-foreground'
                    : 'border border-input bg-background text-muted-foreground hover:bg-accent'
                )}
              >
                <Star
                  className="w-5 h-5"
                  fill={filled ? 'currentColor' : 'none'}
                />
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label
          htmlFor="feedback-comment"
          className="text-sm font-medium mb-2 block"
        >
          Comment{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Textarea
          id="feedback-comment"
          rows={4}
          disabled={pending}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What stood out? What could've been better?"
          className="resize-none"
        />
      </div>
      <Button
        className="w-full"
        disabled={!canSubmit}
        onClick={() => onSubmit(rating, comment)}
      >
        {pending
          ? isEdit
            ? 'Updating…'
            : 'Submitting…'
          : isEdit
          ? 'Update feedback'
          : 'Submit feedback'}
      </Button>
    </div>
  )
}
