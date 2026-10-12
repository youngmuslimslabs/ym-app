import { BrandScope } from '@/components/brand/brand-scope'

// Login has adopted the brand. There is no signed-in member here, so it is
// always General (sign-out clears the side cookie).
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="min-h-dvh">{children}</BrandScope>
}
