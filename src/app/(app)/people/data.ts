import { fetchPeopleForDirectory, fetchFilterCategories } from '@/lib/supabase/queries'
import type { PersonListItem, FilterCategory } from './types'

export async function getPeoplePageData(): Promise<{
  people: PersonListItem[]
  filterCategories: FilterCategory[]
}> {
  const [people, filters] = await Promise.all([
    fetchPeopleForDirectory(),
    fetchFilterCategories(),
  ])

  // Transform filter categories to match UI format
  const filterCategories: FilterCategory[] = [
    { id: 'regions', label: 'Regions', options: filters.regions },
    { id: 'subregions', label: 'Subregions', options: filters.subregions },
    { id: 'neighborNets', label: 'NeighborNets', options: filters.neighborNets },
    { id: 'roles', label: 'Roles', options: filters.roles },
    { id: 'skills', label: 'Skills', options: filters.skills },
  ]

  return { people, filterCategories }
}
