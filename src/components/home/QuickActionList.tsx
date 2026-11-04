import { type LucideIcon } from 'lucide-react'
import { QuickActionRow } from './QuickActionRow'

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
    <div className="divide-y divide-border overflow-hidden rounded-3xl border bg-card">
      {actions.map((action) => (
        <QuickActionRow
          key={action.href}
          {...action}
        />
      ))}
    </div>
  )
}
