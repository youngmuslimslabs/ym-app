'use client'

import { Circle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useProfileCompletion } from '@/contexts/ProfileCompletionContext'

// The contextual half of the pattern: a bottom sheet that fires at the moment a
// user tries an outbound action while incomplete. It names the exact action and
// the specific fields needed, reuses the SAME progress bar as the card, and
// always offers "Not now". "Add details" simulates finishing the missing fields.
export function ProfileGate() {
  const { gateRequest, closeGate, markComplete, completion } =
    useProfileCompletion()

  const open = gateRequest !== null

  function handleAddDetails() {
    // Prototype: jump straight to complete. In the real app this deep-links to
    // the specific missing fields, then returns and auto-continues the action.
    markComplete()
    toast.success('Profile complete')
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) closeGate()
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-2xl">
        {gateRequest && (
          <div className="flex flex-col">
            <SheetHeader>
              <div className="mb-1 w-fit rounded-full bg-primary/10 p-2.5">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <SheetTitle>Add your details to {gateRequest.action}</SheetTitle>
              <SheetDescription>
                People need to know who you are first — it only takes about 30
                seconds.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 flex items-center gap-3">
              <Progress value={completion.percent} className="flex-1" />
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {completion.missing.length}{' '}
                {completion.missing.length === 1 ? 'field' : 'fields'} to go
              </span>
            </div>

            <ul className="mt-4 flex flex-col gap-2">
              {gateRequest.requiredLabels.map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-sm text-foreground/80"
                >
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={handleAddDetails}>Add details</Button>
              <Button variant="ghost" onClick={closeGate}>
                Not now
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
