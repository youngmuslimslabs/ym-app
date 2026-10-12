'use client'

import { type ReactNode } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SectionHeader } from './SectionHeader'

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
        'overflow-hidden transition-all duration-200 ease-out [[data-theme=ym]_&]:rounded-2xl [[data-theme=ym]_&]:shadow-none',
        isExpanded
          ? 'ring-2 ring-primary/20 shadow-lg [[data-theme=ym]_&]:border-primary/40 [[data-theme=ym]_&]:ring-1'
          : 'hover:shadow-md [[data-theme=ym]_&]:hover:border-primary/30 [[data-theme=ym]_&]:hover:shadow-none',
        className
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-4 p-4 text-left transition-colors [[data-theme=ym]_&]:min-h-14 [[data-theme=ym]_&]:px-6',
          'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring'
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate [[data-theme=ym]_&]:text-h3 [[data-theme=ym]_&]:font-semibold">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="shrink-0 [[data-theme=ym]_&]:bg-success/15 [[data-theme=ym]_&]:text-success">
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
            'h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable content */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0 pb-4 border-t [[data-theme=ym]_&]:pb-6">
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
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 [[data-theme=ym]_&]:min-h-11"
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
  addLabel?: string
  onAdd?: () => void
  children: ReactNode
  className?: string
  emptyState?: ReactNode
}

export function ExpandableCardList({
  title,
  description,
  addLabel,
  onAdd,
  children,
  className,
  emptyState,
}: ExpandableCardListProps) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children

  return (
    <section className={cn('space-y-5', className)}>
      {title && (
        <SectionHeader title={title} description={description} />
      )}

      {!hasChildren && emptyState ? (
        emptyState
      ) : (
        <div className="space-y-3">
          {children}

          {onAdd && addLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={onAdd}
              className="w-full border-dashed hover:border-solid hover:border-primary hover:bg-primary/5 [[data-theme=ym]_&]:min-h-11 [[data-theme=ym]_&]:rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addLabel}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
