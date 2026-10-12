'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag } from 'lucide-react'
import type { PersonListItem } from '../types'
import { ROLE_CATEGORY_ICONS, ROLE_CATEGORY_VARIANTS } from '../constants'
import { SIDE_LABELS } from '@/lib/side'
import { MemberAvatar } from '@/components/brand/member-avatar'

interface PersonCardProps {
  person: PersonListItem
}

export function PersonCard({ person }: PersonCardProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get location display (prefer subregion, fallback to region)
  const place = person.subregion?.name ?? person.region?.name ?? 'No location'
  const location = person.side ? `${place} · ${SIDE_LABELS[person.side]}` : place

  const inner = (
    <>
      <div className="relative p-6">
        {/* Header: Avatar + Name + Location */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar: the name is printed beside it, so it's decorative */}
          <MemberAvatar
            name={`${person.firstName} ${person.lastName}`}
            src={person.avatarUrl}
            side={person.side ?? 'general'}
            size="md"
            decorative
          />

          {/* Name and Location */}
          <div className="min-w-0 flex-1">
            <h3
              className={`ym-h3 truncate ${person.isClaimed ? 'text-foreground transition-colors duration-200 group-hover:text-primary' : 'text-muted-foreground'}`}
            >
              {person.firstName} {person.lastName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {person.isClaimed ? location : person.email}
            </p>
          </div>
        </div>

        {/* Roles — only for claimed users */}
        {person.isClaimed && person.roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {person.roles.map((role, i) => {
              const Icon = ROLE_CATEGORY_ICONS[role.category]
              const variant = ROLE_CATEGORY_VARIANTS[role.category] ?? 'outline'
              return (
                <Badge
                  key={`${role.id}-${i}`}
                  variant={variant}
                  className="gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
                >
                  {Icon && <Icon className="h-3 w-3 opacity-70" aria-hidden="true" />}
                  {role.name}
                </Badge>
              )
            })}
          </div>
        )}

        {/* Skills — only for claimed users */}
        {person.isClaimed && person.skills.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {person.skills.slice(0, 3).join(' • ')}
            </span>
          </div>
        )}

        {/* Unclaimed indicator */}
        {!person.isClaimed && (
          <p className="text-xs text-muted-foreground">
            Not yet joined
          </p>
        )}
      </div>
    </>
  )

  if (!person.isClaimed) {
    return (
      <Card className="group relative h-full overflow-hidden rounded-2xl border-dashed bg-transparent shadow-none">
        {inner}
      </Card>
    )
  }

  const currentUrl =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  const href = `/people/${person.id}?back=${encodeURIComponent(currentUrl)}`

  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`View profile of ${person.firstName} ${person.lastName}`}
    >
      <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl shadow-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:hover:translate-y-0">
        {inner}
      </Card>
    </Link>
  )
}
