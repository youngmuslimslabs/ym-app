'use client'

import { useState, useMemo, useCallback } from 'react'
import type { PersonListItem, PeopleFilters } from '../types'
import { getInitialFilters } from '../mock-data'

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

  const filteredPeople = useMemo(() => {
    return people.filter((person) => {
      // Search filter (name match)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const fullName = `${person.firstName} ${person.lastName}`.toLowerCase()
        if (!fullName.includes(searchLower)) {
          return false
        }
      }

      // Region filter
      if (filters.regions.length > 0) {
        if (!filters.regions.includes(person.region.id)) {
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
          // Skills are stored as names in mock data, so match by converting ID to name-like format
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
  }, [people, filters])

  return {
    filters,
    setSearch,
    setFilterValues,
    clearCategory,
    clearAllFilters,
    filteredPeople,
  }
}
