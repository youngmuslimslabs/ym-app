import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

/**
 * Interactive card for quick navigation to app sections.
 *
 * Features a lift animation on hover and proper focus states
 * for keyboard accessibility.
 */
export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  className,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="block group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          'transition-all duration-200',
          'hover:-translate-y-1 hover:shadow-lg',
          className
        )}
      >
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
