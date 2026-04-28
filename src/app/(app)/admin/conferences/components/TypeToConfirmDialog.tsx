'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  // The exact string the user must type to enable the confirm button.
  // Sessions: "delete". Conferences: their full name verbatim.
  confirmText: string
  // Button label in the resting state.
  confirmLabel: string
  // Button label while the action is in flight.
  pendingLabel?: string
  // Visual treatment. Destructive = red icon + destructive button (delete).
  // Primary = blue icon + primary button (publish, anything else permanent).
  tone?: 'destructive' | 'primary'
  pending?: boolean
  onConfirm: () => Promise<void> | void
}

export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  confirmLabel,
  pendingLabel = 'Working…',
  tone = 'destructive',
  pending = false,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState('')

  // Reset the typed value whenever the dialog re-opens. Without this, a
  // previous correct input would keep the confirm button enabled when
  // re-opening for a different target.
  useEffect(() => {
    if (open) setTyped('')
  }, [open])

  const matches = typed === confirmText
  const Icon = tone === 'destructive' ? AlertTriangle : CheckCircle2

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={
                tone === 'destructive'
                  ? 'rounded-full bg-destructive/10 p-2 shrink-0'
                  : 'rounded-full bg-primary/10 p-2 shrink-0'
              }
            >
              <Icon
                className={
                  tone === 'destructive'
                    ? 'w-5 h-5 text-destructive'
                    : 'w-5 h-5 text-primary'
                }
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div>
          <Label htmlFor="type-confirm" className="text-xs">
            Type{' '}
            <span className="font-mono text-foreground">{confirmText}</span> to
            confirm
          </Label>
          <Input
            id="type-confirm"
            autoFocus
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={pending}
            className="mt-1.5"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            disabled={!matches || pending}
            onClick={async () => {
              await onConfirm()
            }}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
