// Types for People Directory
// TODO: These types should eventually be generated from the Supabase schema

export interface PersonListItem {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  email: string // For copy emails feature
  region: {
    id: string
    name: string
  }
  subregion?: {
    id: string
    name: string
  }
  neighborNet?: {
    id: string
    name: string
  }
  roles: {
    id: string
    name: string
    category: 'ns' | 'council' | 'regional' | 'subregional' | 'neighbor_net' | 'cabinet' | 'cloud'
  }[]
  skills: string[]
  yearsInYM?: number // Calculated from membership.joined_at
}

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

export interface FilterOption {
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
