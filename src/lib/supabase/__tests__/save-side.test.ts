import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Side } from '@/lib/side'

// update().eq().is().select() — the write-once update
const updateSelect = vi.fn()
const updateChain = {
  eq: vi.fn(() => updateChain),
  is: vi.fn(() => updateChain),
  select: updateSelect,
}
// select().eq().maybeSingle() — the "was it already set?" read-back
const readMaybeSingle = vi.fn()
const readChain = {
  eq: vi.fn(() => readChain),
  maybeSingle: readMaybeSingle,
}
const table = {
  update: vi.fn(() => updateChain),
  select: vi.fn(() => readChain),
}

vi.mock('../client', () => ({
  createClient: () => ({ from: () => table }),
}))

describe('saveSide (write-once)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets the side only on a row where it is still NULL', async () => {
    updateSelect.mockResolvedValue({ data: [{ id: 'u1' }], error: null })
    const { saveSide } = await import('../onboarding')

    expect(await saveSide('u1', 'sisters')).toEqual({ success: true })
    expect(table.update).toHaveBeenCalledWith({ side: 'sisters' })
    expect(updateChain.eq).toHaveBeenCalledWith('id', 'u1')
    expect(updateChain.is).toHaveBeenCalledWith('side', null)
  })

  it('treats a retry with the same value as success', async () => {
    updateSelect.mockResolvedValue({ data: [], error: null })
    readMaybeSingle.mockResolvedValue({ data: { side: 'brothers' }, error: null })
    const { saveSide } = await import('../onboarding')

    expect(await saveSide('u1', 'brothers')).toEqual({ success: true })
  })

  it('refuses to change a side that is already set', async () => {
    updateSelect.mockResolvedValue({ data: [], error: null })
    readMaybeSingle.mockResolvedValue({ data: { side: 'brothers' }, error: null })
    const { saveSide } = await import('../onboarding')

    const res = await saveSide('u1', 'sisters')
    expect(res.success).toBe(false)
    expect(res.error).toMatch(/already set/i)
  })

  it('does not block onboarding before the side column is migrated', async () => {
    updateSelect.mockResolvedValue({ data: null, error: { code: '42703', message: 'column "side" does not exist' } })
    const { saveSide } = await import('../onboarding')

    expect(await saveSide('u1', 'brothers')).toEqual({ success: true })
  })

  it('rejects anything other than brothers/sisters without touching the DB', async () => {
    const { saveSide } = await import('../onboarding')

    const res = await saveSide('u1', 'other' as Side)
    expect(res.success).toBe(false)
    expect(table.update).not.toHaveBeenCalled()
  })
})
