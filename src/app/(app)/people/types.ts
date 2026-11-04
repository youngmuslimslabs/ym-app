// Types for People Directory
// Import shared types from the query layer
import type { PersonListItem, FilterOption } from '@/lib/supabase/queries/people'

// Re-export for consumers
export type { PersonListItem, FilterOption }

export interface PeopleFilters {
  search: string
  regions: string[] // region IDs
  subregions: string[] // subregion IDs
  neighborNets: string[] // neighbor_net IDs
  roles: string[] // role_type IDs
  projectTypes: string[] // project type values
  projectRoles: string[] // free-form strings
  skills: string[] // skill IDs
  yearsInYM?: {
    min?: number
    max?: number
  }
}

// Extended FilterOption with optional count (extends the base from queries)
export interface FilterOptionWithCount {
  id: string
  name: string
  count?: number
}

export interface FilterCategory {
  id: keyof Omit<PeopleFilters, 'search' | 'yearsInYM'>
  label: string
  options: FilterOption[]
}

export type ViewMode = 'cards' | 'table'
export type SortDirection = 'asc' | 'desc'
export type SortColumn = 'name' | 'region' | 'subregion'
