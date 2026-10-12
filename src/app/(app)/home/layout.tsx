import { BrandScope } from '@/components/brand/brand-scope'
import { getSide } from '@/lib/side-server'

// Home has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout.
export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope side={await getSide()} className="min-h-full">{children}</BrandScope>
}
