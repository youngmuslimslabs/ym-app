import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client so .range(from, to) drives pagination deterministically.
const { rangeMock } = vi.hoisted(() => ({ rangeMock: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          order: () => ({ range: rangeMock }),
        }),
      }),
    }),
  }),
}))

import { fetchAllUsersForSelection, USER_PAGE_SIZE } from './users'

describe('fetchAllUsersForSelection — pages past the 1000-row cap', () => {
  beforeEach(() => rangeMock.mockReset())

  it('fetches every page and includes late-alphabet users the cap would drop', async () => {
    const page0 = Array.from({ length: USER_PAGE_SIZE }, (_, i) => ({
      id: `a${i}`,
      first_name: 'Aisha',
      last_name: String(i),
    }))
    const page1 = [
      { id: 'm1', first_name: 'Muneeb', last_name: 'Syed' },
      { id: 'z1', first_name: 'Zara', last_name: 'Khan' },
    ]
    rangeMock
      .mockResolvedValueOnce({ data: page0, error: null })
      .mockResolvedValueOnce({ data: page1, error: null })

    const { data, error } = await fetchAllUsersForSelection()

    expect(error).toBeNull()
    expect(data).toHaveLength(USER_PAGE_SIZE + 2)
    expect(rangeMock).toHaveBeenCalledTimes(2)
    expect(rangeMock).toHaveBeenNthCalledWith(1, 0, USER_PAGE_SIZE - 1)
    expect(rangeMock).toHaveBeenNthCalledWith(2, USER_PAGE_SIZE, USER_PAGE_SIZE * 2 - 1)
    // The user who was previously unsearchable is now present.
    expect(data?.some((o) => o.label === 'Muneeb Syed')).toBe(true)
  })

  it('stops after one request when the result is under a full page', async () => {
    rangeMock.mockResolvedValueOnce({
      data: [{ id: '1', first_name: 'Sam', last_name: 'One' }],
      error: null,
    })
    const { data } = await fetchAllUsersForSelection()
    expect(data).toHaveLength(1)
    expect(rangeMock).toHaveBeenCalledOnce()
  })

  it('surfaces an error from any page', async () => {
    rangeMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    const { data, error } = await fetchAllUsersForSelection()
    expect(data).toBeNull()
    expect(error).toBe('boom')
  })
})
