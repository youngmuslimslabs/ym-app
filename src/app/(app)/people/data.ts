import { fetchPeopleForDirectory, fetchFilterCategories } from '@/lib/supabase/queries'
import { SIDE_LABELS, SIDES } from '@/lib/side'
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
    { id: 'sides', label: 'Side', options: SIDES.map((s) => ({ id: s, name: SIDE_LABELS[s] })) },
    { id: 'regions', label: 'Regions', options: filters.regions },
    { id: 'subregions', label: 'Subregions', options: filters.subregions },
    { id: 'neighborNets', label: 'NeighborNets', options: filters.neighborNets },
    { id: 'roles', label: 'Roles', options: filters.roles },
    { id: 'skills', label: 'Skills', options: filters.skills },
  ]

  return { people, filterCategories }
}
