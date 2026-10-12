import { BrandScope } from '@/components/brand/brand-scope'
import { getSide } from '@/lib/side-server'
import { PortalBrandBridge } from './components/PortalBrandBridge'

// Admin has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout.
//
// Radix dialogs, selects, popovers, menus and tooltips render in a portal on
// <body>, outside this scope, so they would keep the legacy tokens. The bridge
// carries the scope across to them (see PortalBrandBridge).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const side = await getSide()
  return (
    <BrandScope side={side} className="min-h-full">
      <PortalBrandBridge side={side} />
      {children}
    </BrandScope>
  )
}
