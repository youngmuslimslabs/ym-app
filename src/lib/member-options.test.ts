import { describe, it, expect } from 'vitest'

import { toMemberOptions, type MemberOptionSource } from './member-options'

const member = (id: string, overrides: Partial<MemberOptionSource> = {}): MemberOptionSource => ({
  id,
  first_name: 'Zaid',
  last_name: 'Khan',
  email: `${id}@youngmuslims.com`,
  subregion: null,
  neighborNet: null,
  ...overrides,
})

describe('toMemberOptions (#64)', () => {
  it('leaves unique names alone', () => {
    expect(toMemberOptions([member('a', { first_name: 'Omar', subregion: 'Houston' })])).toEqual([
      { value: 'a', label: 'Omar Khan' },
    ])
  })

  it('tells namesakes apart by subregion', () => {
    const options = toMemberOptions([
      member('a', { subregion: 'Houston' }),
      member('b', { subregion: 'Dallas' }),
    ])
    expect(options.map((o) => o.description)).toEqual(['Houston', 'Dallas'])
  })

  it('adds the NeighborNet when namesakes share a subregion', () => {
    const options = toMemberOptions([
      member('a', { subregion: 'Houston', neighborNet: 'Katy' }),
      member('b', { subregion: 'Houston', neighborNet: 'Sugar Land' }),
      member('c', { subregion: 'Dallas', neighborNet: 'Plano' }),
    ])
    expect(options.map((o) => o.description)).toEqual([
      'Katy · Houston',
      'Sugar Land · Houston',
      'Dallas',
    ])
  })

  it('falls back to email when location cannot separate them', () => {
    const options = toMemberOptions([
      member('a', { subregion: 'Houston', neighborNet: 'Katy' }),
      member('b', { subregion: 'Houston', neighborNet: 'Katy' }),
      member('c'),
    ])
    expect(options.map((o) => o.description)).toEqual([
      'a@youngmuslims.com',
      'b@youngmuslims.com',
      'c@youngmuslims.com',
    ])
  })

  it('matches names case-insensitively', () => {
    const options = toMemberOptions([
      member('a', { subregion: 'Houston' }),
      member('b', { first_name: 'zaid', last_name: 'khan', subregion: 'Austin' }),
    ])
    expect(options.map((o) => o.description)).toEqual(['Houston', 'Austin'])
  })
})
