'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PersonListItem } from '../types'

// Role category colors for visual distinction
const ROLE_CATEGORY_STYLES: Record<string, string> = {
  ns: 'bg-amber-100 text-amber-800 border-amber-200',
  council: 'bg-purple-100 text-purple-800 border-purple-200',
  regional: 'bg-blue-100 text-blue-800 border-blue-200',
  subregional: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  neighbor_net: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cabinet: 'bg-rose-100 text-rose-800 border-rose-200',
  cloud: 'bg-violet-100 text-violet-800 border-violet-200',
}

interface PersonCardProps {
  person: PersonListItem
}

export function PersonCard({ person }: PersonCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/people/${person.id}`)
  }

  // Get location display (prefer subregion, fallback to region)
  const location = person.subregion?.name ?? person.region.name

  // Get initials for avatar fallback
  const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`

  return (
    <Card
      onClick={handleClick}
      className="group relative h-full cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20 active:scale-[0.99]"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-5">
        {/* Header: Avatar + Name + Location */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          {person.avatarUrl ? (
            <img
              src={person.avatarUrl}
              alt={`${person.firstName} ${person.lastName}`}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-background shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-background shadow-sm">
              <span className="text-sm font-semibold text-primary/70">
                {initials}
              </span>
            </div>
          )}

          {/* Name and Location */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {person.firstName} {person.lastName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {location}
            </p>
          </div>
        </div>

        {/* Roles */}
        {person.roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {person.roles.map((role) => (
              <Badge
                key={role.id}
                variant="outline"
                className={`text-[11px] font-medium px-2 py-0.5 ${ROLE_CATEGORY_STYLES[role.category] ?? 'bg-secondary'}`}
              >
                {role.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Skills */}
        {person.skills.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="opacity-60">🏷️</span>
            <span className="truncate">
              {person.skills.slice(0, 3).join(' • ')}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}
