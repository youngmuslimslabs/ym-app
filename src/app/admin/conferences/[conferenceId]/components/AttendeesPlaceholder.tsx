import { Users } from 'lucide-react'

// Stage 4 will replace this with the PeoplePicker-in-selectMode flow. Until
// then the tab still appears in the editor (for layout consistency) but lets
// admins know what's coming.
interface Props {
  invitedCount: number
}

export function AttendeesPlaceholder({ invitedCount }: Props) {
  return (
    <div className="max-w-md mx-auto py-12 text-center">
      <div className="mx-auto rounded-full bg-muted/50 p-4 w-fit mb-4">
        <Users className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold tracking-tight mb-1.5">
        {invitedCount > 0
          ? `${invitedCount.toLocaleString()} ${invitedCount === 1 ? 'attendee' : 'attendees'} invited`
          : 'No attendees invited yet'}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Inviting and removing attendees lands in the next stage. For now, the
        invite list is managed in the database directly.
      </p>
    </div>
  )
}
