import type { ComboboxOption } from '@/components/searchable-combobox'

export interface MemberOptionSource {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  subregion: string | null
  neighborNet: string | null
}

/**
 * Member picker options, labelled by name. Members who share a name get a
 * short description so they can be told apart (#64, "3 Zaid Khans"):
 * their subregion, then "NeighborNet · subregion" if that still collides,
 * then their email as a last resort. Unique names get no description, so
 * the list stays clean.
 */
export function toMemberOptions(members: MemberOptionSource[]): ComboboxOption[] {
  const labelOf = (m: MemberOptionSource) =>
    `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown User'

  const byName = new Map<string, MemberOptionSource[]>()
  for (const m of members) {
    const key = labelOf(m).toLowerCase()
    byName.set(key, [...(byName.get(key) ?? []), m])
  }

  return members.map((m) => {
    const label = labelOf(m)
    const namesakes = byName.get(label.toLowerCase()) ?? []
    if (namesakes.length < 2) return { value: m.id, label }

    const bySubregion = (x: MemberOptionSource) => x.subregion
    const byPlace = (x: MemberOptionSource) =>
      [x.neighborNet, x.subregion].filter(Boolean).join(' · ') || null
    const uniqueAmong = (describe: (x: MemberOptionSource) => string | null) => {
      const mine = describe(m)
      return mine && namesakes.filter((x) => describe(x) === mine).length === 1 ? mine : null
    }

    const description = uniqueAmong(bySubregion) ?? uniqueAmong(byPlace) ?? m.email ?? undefined
    return description ? { value: m.id, label, description } : { value: m.id, label }
  })
}
