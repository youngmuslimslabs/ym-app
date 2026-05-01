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
    <div className="flex flex-col gap-0.5">
      {actions.map((action) => (
        <QuickActionRow key={action.href} {...action} />
      ))}
    </div>
  )
}
