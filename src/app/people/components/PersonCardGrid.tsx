'use client'

import { PersonCard } from './PersonCard'
import type { PersonListItem } from '../types'

interface PersonCardGridProps {
  people: PersonListItem[]
}

export function PersonCardGrid({ people }: PersonCardGridProps) {
  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-lg font-medium text-foreground mb-1">No people found</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try adjusting your search or filters to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
      {people.map((person, index) => (
        <div
          key={person.id}
          className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
        >
          <PersonCard person={person} />
        </div>
      ))}
    </div>
  )
}
