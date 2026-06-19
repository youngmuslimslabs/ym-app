// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

type QueryResult = { data: unknown[] | null; error: { message: string } | null }

// Mutated per-test, mirroring the established loadRoster.test.ts mock pattern.
let roleTypesResult: QueryResult = { data: [], error: null }

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => {
      type Builder = {
        select: () => Builder
        order: () => Promise<QueryResult>
      }
      const builder: Builder = {
        select: () => builder,
        order: () => Promise.resolve(roleTypesResult),
      }
      return builder
    },
  }),
}))

import { fetchRoleTypes } from './roles'

const roleRow = (over: Partial<Record<string, unknown>>) => ({
  id: 'id',
  name: 'name',
  code: 'code',
  category: 'neighbor_net',
  scope_type: 'neighbor_net',
  description: null,
  sort_order: 1,
  ...over,
})

beforeEach(() => {
  roleTypesResult = { data: [], error: null }
})

describe('fetchRoleTypes', () => {
  it('excludes system-category roles (event_admin) so they never reach the picker', async () => {
    roleTypesResult = {
      data: [
        roleRow({ id: '1', code: 'nnc', category: 'neighbor_net' }),
        roleRow({ id: '100', code: 'event_admin', category: 'system', name: 'Event Admin' }),
      ],
      error: null,
    }

    const { data, error } = await fetchRoleTypes()

    expect(error).toBeNull()
    expect(data?.map((r) => r.code)).toEqual(['nnc'])
    expect(data?.some((r) => r.category === 'system')).toBe(false)
  })

  it('returns all non-system roles unchanged', async () => {
    roleTypesResult = {
      data: [
        roleRow({ id: '1', code: 'nnc', category: 'neighbor_net' }),
        roleRow({ id: '2', code: 'src', category: 'subregional' }),
        roleRow({ id: '3', code: 'nc', category: 'ns' }),
      ],
      error: null,
    }

    const { data, error } = await fetchRoleTypes()

    expect(error).toBeNull()
    expect(data?.map((r) => r.code)).toEqual(['nnc', 'src', 'nc'])
  })

  it('passes through a query error', async () => {
    roleTypesResult = { data: null, error: { message: 'permission denied' } }

    const { data, error } = await fetchRoleTypes()

    expect(data).toBeNull()
    expect(error).toBe('permission denied')
  })
})
