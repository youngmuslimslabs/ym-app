'use client'

import { useState } from 'react'
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
  /** Custom error message (default: "Failed to save") */
  errorMessage?: string
  /** Duration to show success/error message in ms (default: 2000) */
  successDuration?: number
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
 * - Glassmorphism design with smooth animations
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
  errorMessage = 'Failed to save',
  successDuration = 2000,
  className,
}: FloatingSaveBarProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    setShowError(false)
    try {
      await onSave()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), successDuration)
    } catch (error) {
      console.error('Failed to save:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), successDuration)
    } finally {
      setIsSaving(false)
    }
  }

  if (!hasChanges && !showSuccess && !showError) return null

  const changeText =
    changeCount !== undefined
      ? `${changeCount} unsaved ${changeCount === 1 ? 'change' : 'changes'}`
      : 'Unsaved changes'

  // Shorter text for mobile
  const shortChangeText =
    changeCount !== undefined ? `${changeCount} unsaved` : 'Unsaved'

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        // Ensure it doesn't overflow on narrow screens
        'max-w-[calc(100vw-2rem)]',
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 bg-background/95 backdrop-blur-sm border shadow-lg rounded-full pl-3 sm:pl-4 pr-2 py-2">
        {showSuccess ? (
          <>
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-sm font-medium text-green-600 whitespace-nowrap">
              {successMessage}
            </span>
            <div className="w-10" /> {/* Spacer for visual balance */}
          </>
        ) : showError ? (
          <>
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm font-medium text-destructive whitespace-nowrap">
              {errorMessage}
            </span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              variant="destructive"
              className="rounded-full px-3 sm:px-4 shrink-0"
            >
              Retry
            </Button>
          </>
        ) : (
          <>
            {/* Show shorter text on mobile, full text on larger screens */}
            <span className="text-sm text-muted-foreground whitespace-nowrap sm:hidden">
              {shortChangeText}
            </span>
            <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline">
              {changeText}
            </span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="rounded-full px-3 sm:px-4 shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{saveLabel}</span>
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
