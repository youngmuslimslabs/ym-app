'use client'

import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

interface CompletionGateProps {
  open: boolean
  action: string
  onDismiss: () => void
  onGoToComplete: () => void
}

/**
 * The gate is a doorway, not a form: a brief notice that routes the user to the
 * full-screen completion flow, then back to what they were doing.
 */
export function CompletionGate({ open, action, onDismiss, onGoToComplete }: CompletionGateProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss()
      }}
    >
      <DialogContent className="max-w-sm">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <DialogTitle className="text-lg font-bold tracking-tight">
          Complete your profile to {action}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Finish setting up your profile so organizers and members know who you are. It only takes
          a couple of minutes.
        </DialogDescription>
        <div className="mt-2 flex flex-col gap-2">
          <Button onClick={onGoToComplete}>Complete my profile</Button>
          <Button variant="ghost" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
