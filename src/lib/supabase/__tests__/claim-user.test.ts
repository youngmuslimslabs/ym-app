import { describe, it, expect, vi, beforeEach } from 'vitest'

const chain = {
  update: vi.fn(() => chain),
  eq: vi.fn(() => chain),
  is: vi.fn(() => chain),
  select: vi.fn(),
}
const fromMock = vi.fn(() => chain)
const createClientMock = vi.fn((..._args: unknown[]) => ({ from: fromMock }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

describe('claimUserByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  })

  it('links an unclaimed row and reports claimed=true', async () => {
    chain.select.mockResolvedValue({ data: [{ id: 'u1' }], error: null })
    const { claimUserByEmail } = await import('../claim-user')

    const res = await claimUserByEmail('auth-1', 'Test.Person@Example.com')

    expect(res).toEqual({ claimed: true })
    // matches on the normalized (trimmed + lowercased) email...
    expect(chain.eq).toHaveBeenCalledWith('email', 'test.person@example.com')
    // ...and only ever touches an unclaimed row, so it can't hijack an account
    expect(chain.is).toHaveBeenCalledWith('auth_id', null)
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ auth_id: 'auth-1' }),
    )
  })

  it('reports claimed=false when no unclaimed row matches', async () => {
    chain.select.mockResolvedValue({ data: [], error: null })
    const { claimUserByEmail } = await import('../claim-user')

    const res = await claimUserByEmail('auth-1', 'someone@example.com')

    expect(res.claimed).toBe(false)
  })

  it('surfaces the db error without throwing', async () => {
    chain.select.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const { claimUserByEmail } = await import('../claim-user')

    const res = await claimUserByEmail('auth-1', 'someone@example.com')

    expect(res).toEqual({ claimed: false, error: 'boom' })
  })

  it('fails safe when service credentials are missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const { claimUserByEmail } = await import('../claim-user')

    const res = await claimUserByEmail('auth-1', 'someone@example.com')

    expect(res).toEqual({ claimed: false, error: 'missing_service_credentials' })
    expect(createClientMock).not.toHaveBeenCalled()
  })
})
