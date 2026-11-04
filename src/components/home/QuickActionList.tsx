import { type LucideIcon } from 'lucide-react'
import { QUICK_ACTION_TINTS, QuickActionRow } from './QuickActionRow'

interface QuickAction {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

interface QuickActionListProps {
  actions: QuickAction[]
}

export function QuickActionList({ actions }: QuickActionListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action, i) => (
        <QuickActionRow
          key={action.href}
          {...action}
          tint={QUICK_ACTION_TINTS[i % QUICK_ACTION_TINTS.length]}
        />
      ))}
    </div>
  )
}
