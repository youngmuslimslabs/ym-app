'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
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

function readViewFromParams(params: URLSearchParams): ViewMode {
  return params.get('view') === 'table' ? 'table' : 'cards'
}

export function PeoplePageClient({ initialPeople, filterCategories }: PeoplePageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const posthog = usePostHog()
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    readViewFromParams(new URLSearchParams(searchParams.toString())),
  )

  const handleViewChange = useCallback(
    (newMode: ViewMode) => {
      setViewMode(newMode)
      posthog?.capture('people_view_toggled', { view_mode: newMode })
    },
    [posthog],
  )

  // viewMode → URL (immediate; toggle is a single discrete action)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (viewMode === 'cards') {
      params.delete('view')
    } else {
      params.set('view', viewMode)
    }
    const queryString = params.toString()
    const next = queryString ? `${pathname}?${queryString}` : pathname
    const current =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (next !== current) {
      router.replace(next, { scroll: false })
    }
  }, [viewMode, pathname, router, searchParams])

  // URL → viewMode (browser back/forward, paste-in URL)
  useEffect(() => {
    const urlView = readViewFromParams(new URLSearchParams(searchParams.toString()))
    setViewMode((current) => (current === urlView ? current : urlView))
  }, [searchParams])

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
                  <ViewToggle view={viewMode} onChange={handleViewChange} />
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
