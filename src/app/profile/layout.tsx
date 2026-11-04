import { BrandScope } from '@/components/brand/brand-scope'

// Profile has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout. /profile
// sits outside the (app) shell, so this is the whole page, hence min-h-screen.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="min-h-screen">{children}</BrandScope>
}
