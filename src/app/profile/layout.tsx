import { BrandScope } from '@/components/brand/brand-scope'
import { getSide } from '@/lib/side-server'

// Profile has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout. /profile
// sits outside the (app) shell, so this is the whole page, hence min-h-screen.
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope side={await getSide()} className="min-h-screen">{children}</BrandScope>
}
