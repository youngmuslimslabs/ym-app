'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Fuse, { type IFuseOptions } from 'fuse.js'
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
  const [filters, setFilters] = useState<PeopleFilters>(getInitialFilters())

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setFilterValues = useCallback(
    (category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>, values: string[]) => {
      setFilters((prev) => ({ ...prev, [category]: values }))
    },
    []
  )

  const clearCategory = useCallback(
    (category: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>) => {
      setFilters((prev) => ({ ...prev, [category]: [] }))
    },
    []
  )

  const clearAllFilters = useCallback(() => {
    setFilters(getInitialFilters())
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
  }, [])

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
