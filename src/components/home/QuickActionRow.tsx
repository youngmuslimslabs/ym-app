import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface QuickActionRowProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

/** One Home shortcut, as a tile. One per row on phones, three across from sm. */
export function QuickActionRow({
  href,
  icon: Icon,
  title,
  description,
}: QuickActionRowProps) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-11 items-center gap-4 rounded-2xl border bg-card p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:hover:translate-y-0 sm:flex-col sm:items-start sm:gap-6 sm:p-5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="ym-h3">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:absolute sm:right-5 sm:top-5"
        aria-hidden="true"
      />
    </Link>
  )
}
