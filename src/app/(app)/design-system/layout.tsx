import { BrandScope } from '@/components/brand/brand-scope'

/**
 * The reference page is fully inside the brand scope. Fonts load in the root
 * layout (lib/brand-fonts.ts), which only exposes them as CSS variables.
 */
export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <BrandScope className="min-h-full">{children}</BrandScope>
}
