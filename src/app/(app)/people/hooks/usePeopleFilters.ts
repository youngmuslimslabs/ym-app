'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Fuse, { type IFuseOptions } from 'fuse.js'
import posthog from 'posthog-js'
import type { PersonListItem, PeopleFilters } from '../types'

const FUSE_OPTIONS: IFuseOptions<PersonListItem> = {
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'firstName', weight: 2 },
    { name: 'lastName', weight: 2 },
    { name: 'roles.name', weight: 1.5 },
    { name: 'region.name', weight: 1 },
    { name: 'subregion.name', weight: 1 },
    { name: 'skills', weight: 1 },
    { name: 'email', weight: 1.5 },
  ],
}

function getInitialFilters(): PeopleFilters {
  return {
    search: '',
    regions: [],
    subregions: [],
    neighborNets: [],
    roles: [],
    projectTypes: [],
    projectRoles: [],
    skills: [],
    yearsInYM: undefined,
  }
}

const MULTI_FILTER_KEYS = [
  'regions',
  'subregions',
  'neighborNets',
  'roles',
  'projectTypes',
  'projectRoles',
  'skills',
] as const

function readFiltersFromParams(params: URLSearchParams): PeopleFilters {
  const filters = getInitialFilters()
  const search = params.get('search')
  if (search) filters.search = search
  for (const key of MULTI_FILTER_KEYS) {
    const values = params.getAll(key)
    if (values.length > 0) filters[key] = values
  }
  return filters
}

/**
 * Serialize filters into URLSearchParams while preserving any unrelated
 * params already present (e.g., 'view'). Empty values are omitted so the
 * URL stays clean.
 */
function writeFiltersToParams(
  filters: PeopleFilters,
  current: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams()

  // Preserve unrelated params (e.g., view, back)
  for (const [key, value] of current.entries()) {
    if (key === 'search') continue
    if ((MULTI_FILTER_KEYS as readonly string[]).includes(key)) continue
    next.append(key, value)
  }

  if (filters.search) next.set('search', filters.search)
  for (const key of MULTI_FILTER_KEYS) {
    for (const value of filters[key]) {
      next.append(key, value)
    }
  }

  return next
}

const URL_DEBOUNCE_MS = 300

const PAGE_SIZE = 20

interface UsePeopleFiltersReturn {
  filters: PeopleFilters
  setSearch: (search: string) => void
  setFilterValues: (
    category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>,
    values: string[]
  ) => void
  clearCategory: (category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>) => void
  clearAllFilters: () => void
  filteredPeople: PersonListItem[]
  visiblePeople: PersonListItem[]
  hasMore: boolean
  loadMore: () => void
}

export function usePeopleFilters(people: PersonListItem[]): UsePeopleFiltersReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<PeopleFilters>(() =>
    readFiltersFromParams(new URLSearchParams(searchParams.toString())),
  )

  // Skip writing on first render so initial mount doesn't churn the URL
  // when the URL already matches the derived state.
  const isFirstRender = useRef(true)

  // filters → URL (debounced for typing comfort)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const handle = setTimeout(() => {
      const params = writeFiltersToParams(
        filters,
        new URLSearchParams(searchParams.toString()),
      )
      const queryString = params.toString()
      const url = queryString ? `${pathname}?${queryString}` : pathname
      router.replace(url, { scroll: false })
    }, URL_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [filters, pathname, router, searchParams])

  // URL → filters (external navigation: browser back/forward, paste-in URL)
  useEffect(() => {
    const urlFilters = readFiltersFromParams(
      new URLSearchParams(searchParams.toString()),
    )
    setFilters((current) =>
      JSON.stringify(urlFilters) === JSON.stringify(current) ? current : urlFilters,
    )
  }, [searchParams])

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setFilterValues = useCallback(
    (category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>, values: string[]) => {
      setFilters((prev) => ({ ...prev, [category]: values }))
      try {
        posthog.capture('people_filter_applied', {
          filter_category: category,
          filter_count: values.length,
        })
      } catch { /* observability */ }
    },
    []
  )

  const clearCategory = useCallback(
    (category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>) => {
      setFilters((prev) => ({ ...prev, [category]: [] }))
      try {
        posthog.capture('people_filter_applied', {
          filter_category: category,
          filter_count: 0,
        })
      } catch { /* observability */ }
    },
    []
  )

  const clearAllFilters = useCallback(() => {
    setFilters(getInitialFilters())
    try {
      posthog.capture('people_filter_cleared', {})
    } catch { /* observability */ }
  }, [])

  const fuse = useMemo(() => new Fuse(people, FUSE_OPTIONS), [people])

  const filteredPeople = useMemo(() => {
    // Start from fuzzy results (preserving relevance order) or full list
    const candidates = filters.search
      ? fuse.search(filters.search).map((r) => r.item)
      : people

    return candidates.filter((person) => {
      // Region filter
      if (filters.regions.length > 0) {
        if (!person.region || !filters.regions.includes(person.region.id)) {
          return false
        }
      }

      // Subregion filter
      if (filters.subregions.length > 0) {
        if (!person.subregion || !filters.subregions.includes(person.subregion.id)) {
          return false
        }
      }

      // NeighborNet filter
      if (filters.neighborNets.length > 0) {
        if (!person.neighborNet || !filters.neighborNets.includes(person.neighborNet.id)) {
          return false
        }
      }

      // Role filter
      if (filters.roles.length > 0) {
        const personRoleIds = person.roles.map((r) => r.id)
        if (!filters.roles.some((roleId) => personRoleIds.includes(roleId))) {
          return false
        }
      }

      // Skills filter
      if (filters.skills.length > 0) {
        // Match on skill name (case-insensitive)
        const personSkillsLower = person.skills.map((s) => s.toLowerCase())
        const hasMatchingSkill = filters.skills.some((skillId) => {
          // Skill IDs are generated as lowercase-hyphenated names, convert back to match
          const skillName = skillId.replace(/-/g, ' ')
          return personSkillsLower.some((s) => s.includes(skillName))
        })
        if (!hasMatchingSkill) {
          return false
        }
      }

      // Years in YM filter (range)
      if (filters.yearsInYM) {
        const { min, max } = filters.yearsInYM
        if (person.yearsInYM === undefined) {
          return false
        }
        if (min !== undefined && person.yearsInYM < min) {
          return false
        }
        if (max !== undefined && person.yearsInYM > max) {
          return false
        }
      }

      return true
    })
  }, [people, fuse, filters])

  // Pagination state for Load More
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // Reset visible count when filtered results change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filteredPeople.length])

  const visiblePeople = useMemo(
    () => filteredPeople.slice(0, visibleCount),
    [filteredPeople, visibleCount]
  )

  const hasMore = visibleCount < filteredPeople.length

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE)
    try {
      posthog.capture('people_load_more_clicked', {
        visible_count: visibleCount + PAGE_SIZE,
      })
    } catch { /* observability */ }
  }, [visibleCount])

  return {
    filters,
    setSearch,
    setFilterValues,
    clearCategory,
    clearAllFilters,
    filteredPeople,
    visiblePeople,
    hasMore,
    loadMore,
  }
}
