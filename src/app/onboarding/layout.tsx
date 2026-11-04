import { BrandScope } from '@/components/brand/brand-scope'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="ym-revised-screen min-h-dvh">{children}</BrandScope>
}
