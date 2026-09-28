import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// The one page header (Brandbook p.35 type scale). Replaces the hand-rolled
// title blocks that grew up page by page — reach for this before writing an
// <h1> in a page.
//
//   ← Back link            (optional)
//   EYEBROW                (optional, Figtree caps)
//   BOLDONSE TITLE         [actions]
//   Description / meta     (optional)

interface PageHeaderProps {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  /** Buttons for the page. Sit beside the title on wide screens, below on phones. */
  actions?: React.ReactNode
  back?: { href: string; label: string }
  className?: string
}

export function PageHeader({ title, eyebrow, description, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4', className)}>
      {back && (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md pr-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && <p className="ym-eyebrow text-primary">{eyebrow}</p>}
          <h1 className="ym-h1 text-balance">{title}</h1>
          {description && (
            <p className="max-w-2xl text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  )
}
