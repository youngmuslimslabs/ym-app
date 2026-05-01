// Shared constants for People Directory

import {
  Briefcase,
  Cloud,
  Landmark,
  Map as MapIcon,
  MapPin,
  Network,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * Lucide icon per role category.
 *
 * Categories share a single neutral badge style; the icon is the visual
 * differentiator. This keeps role taxonomy accessible (icons aren't a
 * color-only signal) and avoids hardcoded Tailwind hues in the design system.
 */
export const ROLE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  ns: Landmark,
  council: Users,
  regional: MapIcon,
  subregional: MapPin,
  neighbor_net: Network,
  cabinet: Briefcase,
  cloud: Cloud,
}
