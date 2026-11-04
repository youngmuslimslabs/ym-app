import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface QuickActionRowProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export function QuickActionRow({ href, icon: Icon, title, description }: QuickActionRowProps) {
  return <Link href={href} className="group flex min-h-[60px] items-center gap-4 p-4 transition-colors duration-200 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
    <Icon className="size-6 shrink-0" aria-hidden="true" />
    <span className="flex min-w-0 flex-1 flex-col gap-1"><span className="text-sm font-medium">{title}</span><span className="text-xs text-muted-foreground">{description}</span></span>
    <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
  </Link>
}
