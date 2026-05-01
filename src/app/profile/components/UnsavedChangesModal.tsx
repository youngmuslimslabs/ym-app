'use client'

import { useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onSaveAndLeave: () => void
  onDiscardAndLeave: () => void
  onStay: () => void
  changeCount: number
}

export function UnsavedChangesModal({
  isOpen,
  onSaveAndLeave,
  onDiscardAndLeave,
  onStay,
  changeCount,
}: UnsavedChangesModalProps) {
  // Clicking outside or pressing Escape = stay on page
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onStay()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg">
        <DialogHeader className="text-center">
          <DialogTitle>Save changes?</DialogTitle>
          <DialogDescription>
            You have {changeCount} unsaved {changeCount === 1 ? 'change' : 'changes'}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onDiscardAndLeave}
            className="flex-1"
          >
            Don&apos;t save
          </Button>
          <Button
            onClick={onSaveAndLeave}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to handle browser navigation attempts (beforeunload only)
// For in-app navigation, components should manually check hasChanges and show modal
export function useUnsavedChangesWarning(hasChanges: boolean) {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        // Modern browsers ignore custom messages, but this is still needed
        e.returnValue = ''
        return ''
      }
    },
    [hasChanges]
  )

  useEffect(() => {
    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [hasChanges, handleBeforeUnload])

  // For in-app navigation, components should call onAttemptLeave
  // and show the modal. This hook just handles browser-level navigation.
}
