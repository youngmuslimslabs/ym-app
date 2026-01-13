import { createClient } from '@/lib/supabase/client'

export interface Subregion {
  id: string
  name: string
  region_id: string
  regions?: {
    name: string
  }
}

export interface NeighborNet {
  id: string
  name: string
  subregion_id: string
}

/**
 * Fetch all subregions with their parent region names
 */
export async function fetchSubregions(): Promise<{
  data: Subregion[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('subregions')
      .select('id, name, region_id, regions(name)')
      .order('name')

    if (error) {
      console.error('Error fetching subregions:', error)
      return { data: null, error: error.message }
    }

    return { data: data as Subregion[], error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch subregions'
    console.error('Subregions fetch error:', err)
    return { data: null, error: message }
  }
}

/**
 * Fetch all neighbor nets for a specific subregion
 */
export async function fetchNeighborNetsBySubregion(subregionId: string): Promise<{
  data: NeighborNet[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('neighbor_nets')
      .select('id, name, subregion_id')
      .eq('subregion_id', subregionId)
      .order('name')

    if (error) {
      console.error('Error fetching neighbor nets:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch neighbor nets'
    console.error('Neighbor nets fetch error:', err)
    return { data: null, error: message }
  }
}

/**
 * Fetch all neighbor nets grouped by subregion
 */
export async function fetchAllNeighborNets(): Promise<{
  data: NeighborNet[] | null
  error: string | null
}> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('neighbor_nets')
      .select('id, name, subregion_id')
      .order('name')

    if (error) {
      console.error('Error fetching all neighbor nets:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch neighbor nets'
    console.error('Neighbor nets fetch error:', err)
    return { data: null, error: message }
  }
}
