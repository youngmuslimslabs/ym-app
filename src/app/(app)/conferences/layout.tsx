import { BrandScope } from '@/components/brand/brand-scope'
import { getSide } from '@/lib/side-server'

// Conferences has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout. Radix
// sheets and dialogs portal out of this subtree: see `brandPortalProps` in
// [conferenceId]/lib/brandPortal.ts.
export default async function ConferencesLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope side={await getSide()} className="min-h-full">{children}</BrandScope>
}
