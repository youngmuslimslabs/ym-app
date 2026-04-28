'use client'

import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  PeopleSearch,
  PeopleFilters,
  PersonCardGrid,
  PeopleTable,
  ViewToggle,
  CopyEmailsButton,
  LoadMoreButton,
} from './components'
import { usePeopleFilters } from './hooks/usePeopleFilters'
import type { PersonListItem, FilterCategory, ViewMode } from './types'

interface PeoplePageClientProps {
  initialPeople: PersonListItem[]
  filterCategories: FilterCategory[]
}

export function PeoplePageClient({ initialPeople, filterCategories }: PeoplePageClientProps) {
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const {
    filters,
    setSearch,
    setFilterValues,
    clearCategory,
    clearAllFilters,
    filteredPeople,
    visiblePeople,
    hasMore,
    loadMore,
  } = usePeopleFilters(initialPeople)

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 md:px-6 py-4">
            {/* Single row: Search + Filters + Controls */}
            <div className="flex items-center gap-4">
              <PeopleSearch
                value={filters.search}
                onChange={setSearch}
                placeholder="Search people..."
              />

              {/* Filters - desktop only */}
              {!isMobile && (
                <PeopleFilters
                  filters={filters}
                  filterCategories={filterCategories}
                  onFilterChange={setFilterValues}
                  onClearCategory={clearCategory}
                  onClearAll={clearAllFilters}
                />
              )}

              {/* Spacer to push controls right */}
              <div className="flex-1" />

              {/* View toggle + Copy emails - desktop only */}
              {!isMobile && (
                <div className="flex items-center gap-1">
                  <ViewToggle view={viewMode} onChange={setViewMode} />
                  <CopyEmailsButton people={filteredPeople} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 md:px-6 py-6">
          {/* Cards view (default, always on mobile) */}
          {(viewMode === 'cards' || isMobile) && (
            <>
              <PersonCardGrid people={visiblePeople} />
              <LoadMoreButton hasMore={hasMore} onLoadMore={loadMore} />
            </>
          )}

          {/* Table view (desktop only) */}
          {viewMode === 'table' && !isMobile && (
            <PeopleTable people={filteredPeople} />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
