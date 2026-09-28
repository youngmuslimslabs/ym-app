import { Users, DollarSign, FileText, type LucideIcon } from 'lucide-react'

// Sample content for the design variations. Invented, clearly not a real
// member: these pages are public and exist only to compare layouts.

export const SAMPLE_MEMBER = {
  name: 'Ahmed Khan',
  firstName: 'Ahmed',
  roles: ['Sub-Regional Coordinator', 'Halaqa Lead'],
  neighborNet: 'Maryam Masjid',
  subregion: 'Houston',
}

export const SAMPLE_CONFERENCE = {
  name: 'Fall Retreat 2026',
  dates: 'October 8 – 10',
  place: 'Camp Tall Timbers',
}

export const SAMPLE_STATS = [
  { label: 'Active members', value: '1,284', meta: '+23 this week' },
  { label: 'NeighborNets', value: '118' },
  { label: 'New this week', value: '23', meta: 'say salam' },
]

export interface SampleAction {
  href: string
  icon: LucideIcon
  title: string
  description: string
}

export const SAMPLE_ACTIONS: SampleAction[] = [
  { href: '#', icon: Users, title: 'People', description: 'Find your people across YM' },
  { href: '#', icon: DollarSign, title: 'Finance', description: 'Get reimbursed' },
  { href: '#', icon: FileText, title: 'Docs', description: 'Halaqa guides and SOPs' },
]

export const VARIANTS = ['a', 'b', 'c'] as const
export type Variant = (typeof VARIANTS)[number]

export const VARIANT_INFO: Record<Variant, { name: string; summary: string }> = {
  a: {
    name: 'Warm Snow',
    summary:
      'Light and open. No big colour block: the page stays Warm Snow with warm Buttercup and Jade shapes, and the sidebar goes neutral Obsidian. Side colour only marks buttons, the active page and your avatar.',
  },
  b: {
    name: 'Obsidian',
    summary:
      'One dark block, in neutral Deep Obsidian instead of blue, with small shapes from both sides of the palette. The sidebar turns light so the page has a single dark moment.',
  },
  c: {
    name: 'Palette blocks',
    summary:
      'The street-hoarding look from Brandbook p.14: shortcuts become solid Buttercup, Jade and Obsidian panels, so blue is one colour among several instead of the whole page.',
  },
}
