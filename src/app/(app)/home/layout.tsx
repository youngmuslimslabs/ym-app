import { BrandScope } from '@/components/brand/brand-scope'

// Home has adopted the brand (redesign direction B). The rest of the app
// hasn't yet, so the scope lives on the route, not the root layout.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="min-h-full">{children}</BrandScope>
}
