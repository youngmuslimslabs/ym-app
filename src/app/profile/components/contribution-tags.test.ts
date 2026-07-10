import { describe, it, expect } from 'vitest'

import { parseTags, serializeTags, toggleTag, CONTRIBUTION_TAGS } from './contribution-tags'

describe('contribution-tags storage helpers', () => {
  it('parses a comma-joined string into trimmed tags', () => {
    expect(parseTags('Led a team, Logistics')).toEqual(['Led a team', 'Logistics'])
  })

  it('parses empty/undefined into an empty array', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags(undefined)).toEqual([])
  })

  it('drops blank segments', () => {
    expect(parseTags('Led a team, , ,Logistics,')).toEqual(['Led a team', 'Logistics'])
  })

  it('serializes tags to a comma-joined string', () => {
    expect(serializeTags(['Led a team', 'Logistics'])).toBe('Led a team, Logistics')
  })

  it('round-trips parse(serialize(x)) === x', () => {
    const tags = ['Led a team', 'Fundraising', 'Ops']
    expect(parseTags(serializeTags(tags))).toEqual(tags)
  })

  it('toggleTag adds a tag when absent', () => {
    expect(toggleTag(['Led a team'], 'Logistics')).toEqual(['Led a team', 'Logistics'])
  })

  it('toggleTag removes a tag when present', () => {
    expect(toggleTag(['Led a team', 'Logistics'], 'Led a team')).toEqual(['Logistics'])
  })

  it('exposes a non-empty contribution tag option list', () => {
    expect(CONTRIBUTION_TAGS.length).toBeGreaterThan(0)
    expect(CONTRIBUTION_TAGS[0]).toHaveProperty('value')
    expect(CONTRIBUTION_TAGS[0]).toHaveProperty('label')
  })
})
