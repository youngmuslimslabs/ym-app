'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { replaceSearchParams } from '@/lib/replace-search-params'
import { PageHeader } from '@/components/layout/page-header'
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

  // viewMode → URL (immediate; toggle is a single discrete action). History-only
  // so toggling doesn't re-run the server page and re-send the whole directory.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (viewMode === 'cards') {
      params.delete('view')
    } else {
      params.set('view', viewMode)
    }
    replaceSearchParams(pathname, params)
  }, [viewMode, pathname, searchParams])

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
      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 md:min-h-screen md:pt-10">
        <PageHeader
          title="People"
          description="Find your people across YM."
        />

        {/* Toolbar: sticks under the page title while the directory scrolls */}
        <div className="sticky top-0 z-30 -mx-4 mt-6 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
          {/* Single row: Search + Filters + Controls */}
          <div className="flex items-center gap-4">
            <PeopleSearch
              value={filters.search}
              onChange={setSearch}
              placeholder="Search"
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
            <div className="hidden flex-1 md:block" />

            {/* View toggle + Copy emails - desktop only */}
            {!isMobile && (
              <div className="flex items-center gap-1">
                <ViewToggle view={viewMode} onChange={handleViewChange} />
                <CopyEmailsButton people={filteredPeople} />
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 pt-4">
          {/* Cards view (default, always on mobile) */}
          {(viewMode === 'cards' || isMobile) && (
            <>
              <PersonCardGrid people={visiblePeople} />
              <LoadMoreButton hasMore={hasMore} onLoadMore={loadMore} />
            </>
          )}

          {/* Table view (desktop only) */}
          {viewMode === 'table' && !isMobile && (
            <PeopleTable people={filteredPeople} appearance="brand" />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
