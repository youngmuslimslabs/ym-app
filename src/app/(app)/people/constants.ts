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

/** Lucide icon per role category. */
export const ROLE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  ns: Landmark,
  council: Users,
  regional: MapIcon,
  subregional: MapPin,
  neighbor_net: Network,
  cabinet: Briefcase,
  cloud: Cloud,
}

/** Badge color variant per role category. */
export const ROLE_CATEGORY_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'outline'> = {
  ns: 'info',
  council: 'info',
  regional: 'success',
  subregional: 'success',
  neighbor_net: 'warning',
  cabinet: 'warning',
  cloud: 'outline',
}
