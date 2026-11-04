import { BrandScope } from '@/components/brand/brand-scope'

// Login uses the shared brand; there is no member-specific theme.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="min-h-dvh">{children}</BrandScope>
}
