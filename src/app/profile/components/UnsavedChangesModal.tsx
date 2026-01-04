'use client'

import { useEffect, useCallback } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveAndLeave: () => void
  onDiscardAndLeave: () => void
  onStay: () => void
  changeCount: number
}

export function UnsavedChangesModal({
  isOpen,
  onClose,
  onSaveAndLeave,
  onDiscardAndLeave,
  onStay,
  changeCount,
}: UnsavedChangesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Unsaved changes</DialogTitle>
              <DialogDescription className="mt-1">
                You have {changeCount} unsaved {changeCount === 1 ? 'change' : 'changes'} that will be lost.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={onDiscardAndLeave}
            className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          >
            Discard changes
          </Button>
          <Button
            variant="outline"
            onClick={onStay}
            className="w-full sm:w-auto"
          >
            Stay on page
          </Button>
          <Button
            onClick={onSaveAndLeave}
            className="w-full sm:w-auto"
          >
            Save & leave
          </Button>
        </DialogFooter>
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
