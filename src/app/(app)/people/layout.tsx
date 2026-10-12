import { BrandScope } from '@/components/brand/brand-scope'
import { getSide } from '@/lib/side-server'

// The People directory and the person page adopt the brand (redesign
// direction B). The scope lives on the route, so it covers /people and
// /people/[id] and nothing else.
export default async function PeopleLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope side={await getSide()} className="min-h-full">{children}</BrandScope>
}
