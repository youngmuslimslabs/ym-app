import { describe, it, expect, vi, beforeEach } from 'vitest'

type QueryResult = { data: unknown[] | null; error: { message: string } | null }

let signupsResult: QueryResult = { data: [], error: null }
let checkInsResult: QueryResult = { data: [], error: null }

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => {
      const result = table === 'session_signups' ? signupsResult : checkInsResult
      type Builder = {
        select: () => Builder
        eq: () => Builder
        order: () => Promise<QueryResult>
        then: <T>(onFulfilled?: (v: QueryResult) => T | PromiseLike<T>) => Promise<T>
      }
      const builder: Builder = {
        select: () => builder,
        eq: () => builder,
        order: () => Promise.resolve(result),
        then: (onFulfilled) => Promise.resolve(result).then(onFulfilled!),
      }
      return builder
    },
  }),
}))

import { loadRoster } from './loadRoster'

beforeEach(() => {
  signupsResult = { data: [], error: null }
  checkInsResult = { data: [], error: null }
})

describe('loadRoster', () => {
  it('puts checked-in users first by check-in time, others alphabetical', async () => {
    signupsResult = {
      data: [
        { user_id: 'u1', users: { first_name: 'Alice', last_name: 'A' } },
        { user_id: 'u2', users: { first_name: 'Bob', last_name: 'B' } },
        { user_id: 'u3', users: { first_name: 'Cara', last_name: 'C' } },
      ],
      error: null,
    }
    checkInsResult = {
      data: [
        { user_id: 'u3', checked_in_at: '2026-06-01T13:05:00Z' },
        { user_id: 'u1', checked_in_at: '2026-06-01T13:02:00Z' },
      ],
      error: null,
    }

    const res = await loadRoster('s1')
    expect(res.error).toBeNull()
    expect(res.entries.map((e) => e.name)).toEqual(['Alice A', 'Cara C', 'Bob B'])
    expect(res.entries[0].checkedInAt).toBe('2026-06-01T13:02:00Z')
    expect(res.entries[2].checkedInAt).toBeNull()
  })

  it('handles the embedded users field arriving as an array', async () => {
    signupsResult = {
      data: [
        { user_id: 'u1', users: [{ first_name: 'Alice', last_name: 'A' }] },
      ],
      error: null,
    }
    const res = await loadRoster('s1')
    expect(res.entries[0].name).toBe('Alice A')
  })

  it('falls back to "Unknown attendee" when name is missing', async () => {
    signupsResult = {
      data: [
        { user_id: 'u1', users: null },
        { user_id: 'u2', users: { first_name: null, last_name: null } },
      ],
      error: null,
    }
    const res = await loadRoster('s1')
    expect(res.entries.every((e) => e.name === 'Unknown attendee')).toBe(true)
  })

  it('returns the error message when signups query fails', async () => {
    signupsResult = { data: null, error: { message: 'permission denied' } }
    const res = await loadRoster('s1')
    expect(res.entries).toEqual([])
    expect(res.error).toBe('permission denied')
  })

  it('returns the error message when check-ins query fails', async () => {
    checkInsResult = { data: null, error: { message: 'rls violation' } }
    const res = await loadRoster('s1')
    expect(res.entries).toEqual([])
    expect(res.error).toBe('rls violation')
  })

  it('includes walk-ins (checked in but never signed up)', async () => {
    signupsResult = {
      data: [
        { user_id: 'u1', users: { first_name: 'Alice', last_name: 'A' } },
      ],
      error: null,
    }
    checkInsResult = {
      data: [
        {
          user_id: 'u1',
          checked_in_at: '2026-06-01T13:02:00Z',
          users: { first_name: 'Alice', last_name: 'A' },
        },
        {
          user_id: 'u9',
          checked_in_at: '2026-06-01T13:10:00Z',
          users: { first_name: 'Walk', last_name: 'In' },
        },
      ],
      error: null,
    }

    const res = await loadRoster('s1')
    expect(res.error).toBeNull()
    expect(res.entries).toHaveLength(2)
    const walkIn = res.entries.find((e) => e.userId === 'u9')
    expect(walkIn).toBeDefined()
    expect(walkIn?.name).toBe('Walk In')
    expect(walkIn?.checkedInAt).toBe('2026-06-01T13:10:00Z')
  })
})
