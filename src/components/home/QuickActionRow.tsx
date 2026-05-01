import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface QuickActionRowProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export function QuickActionRow({
  href,
  icon: Icon,
  title,
  description,
}: QuickActionRowProps) {
  return (
    <Link
      href={href}
      className="group -mx-3 grid grid-cols-[24px_1fr_16px] items-center gap-4 rounded-lg px-3 py-3.5 transition-colors hover:bg-accent/70 focus-visible:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Icon className="h-[18px] w-[18px] text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[0.9375rem] font-medium">{title}</span>
        <span className="text-[0.8125rem] text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground">
          {description}
        </span>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:translate-x-0.5 group-focus-visible:opacity-100" />
    </Link>
  )
}
