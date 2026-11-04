'use client'

import { useEffect, useRef, useState } from 'react'
import { Save, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloatingSaveBarProps {
  /** Whether there are unsaved changes */
  hasChanges: boolean
  /** Number of changes to display (optional - if not provided, shows generic message) */
  changeCount?: number
  /** Async function to call when save is clicked */
  onSave: () => Promise<void>
  /** Custom save button text (default: "Save") */
  saveLabel?: string
  /** Custom success message (default: "Changes saved!") */
  successMessage?: string
  /** Custom error message (default: "Couldn't save") */
  errorMessage?: string
  /** Duration to show a successful save confirmation in ms (default: 2000) */
  successDuration?: number
  /** Full-width form footer or the existing floating presentation. */
  presentation?: 'floating' | 'footer'
  /** Additional class names */
  className?: string
}

/**
 * A floating action bar that appears at the bottom of the screen when there are unsaved changes.
 *
 * Features:
 * - Appears only when there are changes (or showing success)
 * - Shows change count with contextual messaging
 * - Loading state during save
 * - Success confirmation that auto-dismisses
 * - Failures stay visible beside Retry until another save succeeds
 * - Optional full-width footer presentation for standalone forms
 *
 * @example
 * ```tsx
 * <FloatingSaveBar
 *   hasChanges={formHasChanges}
 *   changeCount={3}
 *   onSave={handleSave}
 * />
 * ```
 */
export function FloatingSaveBar({
  hasChanges,
  changeCount,
  onSave,
  saveLabel = 'Save',
  successMessage = 'Changes saved!',
  errorMessage = "Couldn't save",
  successDuration = 2000,
  presentation = 'floating',
  className,
}: FloatingSaveBarProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const savingRef = useRef(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (successTimer.current) clearTimeout(successTimer.current)
  }, [])

  const handleSave = async () => {
    if (savingRef.current) return
    savingRef.current = true
    if (successTimer.current) clearTimeout(successTimer.current)
    setShowSuccess(false)
    setIsSaving(true)
    setShowError(false)
    try {
      await onSave()
      setShowSuccess(true)
      successTimer.current = setTimeout(() => setShowSuccess(false), successDuration)
    } catch (error) {
      console.error('FloatingSaveBar onSave threw:', error)
      setShowError(true)
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  if (!hasChanges && !isSaving && !showSuccess && !showError) return null

  const changeText =
    changeCount !== undefined
      ? `${changeCount} unsaved ${changeCount === 1 ? 'change' : 'changes'}`
      : 'Unsaved changes'


  return (
    <div
      className={cn(
        'z-50 animate-in fade-in slide-in-from-bottom-4 duration-200',
        presentation === 'footer'
          ? 'sticky bottom-0 w-full border-t bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          : 'fixed bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)]',
        className
      )}
    >
      <div className={cn(
        'flex items-center gap-3',
        presentation === 'footer'
          ? 'mx-auto min-h-11 max-w-2xl justify-between'
          : 'rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4'
      )}>
        {showSuccess ? (
          <>
            <Check className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
            <span role="status" className="text-sm font-medium text-success">
              {successMessage}
            </span>
          </>
        ) : showError ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />
            <span role="alert" className="min-w-0 flex-1 text-sm font-medium text-destructive">
              {errorMessage}
            </span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              variant="destructive"
              className={cn('shrink-0 px-4', presentation === 'footer' ? 'min-h-11 rounded-md' : 'rounded-full')}
            >
              Retry
            </Button>
          </>
        ) : (
          <>
            <span role="status" className="min-w-0 flex-1 text-sm text-muted-foreground">
              {isSaving ? 'Saving changes…' : changeText}
            </span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className={cn('shrink-0 px-4', presentation === 'footer' ? 'min-h-11 rounded-md' : 'rounded-full')}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" aria-hidden="true" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  <span>{saveLabel}</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
