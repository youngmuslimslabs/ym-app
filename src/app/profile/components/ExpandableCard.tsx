'use client'

import { type ReactNode } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ExpandableCardProps {
  id: string
  title: string
  subtitle?: string
  badge?: string
  isExpanded: boolean
  onToggle: () => void
  onDelete?: () => void
  children: ReactNode
  className?: string
}

export function ExpandableCard({
  title,
  subtitle,
  badge,
  isExpanded,
  onToggle,
  onDelete,
  children,
  className,
}: ExpandableCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 ease-out',
        isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:shadow-md',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors',
          'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="shrink-0">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-300 shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0 pb-4 border-t">
            <div className="pt-4 space-y-4">
              {children}

              {onDelete && (
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )
}

interface ExpandableCardListProps {
  title: string
  description?: string
  addLabel: string
  onAdd: () => void
  children: ReactNode
  className?: string
}

export function ExpandableCardList({
  title,
  description,
  addLabel,
  onAdd,
  children,
  className,
}: ExpandableCardListProps) {
  return (
    <section className={cn('space-y-5', className)}>
      {title && (
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {children}

        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full border-dashed hover:border-solid hover:border-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
      </div>
    </section>
  )
}
