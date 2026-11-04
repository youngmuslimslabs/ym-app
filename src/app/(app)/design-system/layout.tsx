import { boldonse, figtree } from '@/lib/brand-fonts'

/**
 * Opts this route into the Young Muslims brand theme. `data-theme="ym"` swaps
 * the semantic tokens and the body face for everything inside; `tracking-brand`
 * applies the -2% tracking the brand book specifies for both faces (p.34).
 */
export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      data-theme="ym"
      className={`${figtree.variable} ${boldonse.variable} min-h-full bg-background font-sans tracking-brand text-foreground`}
    >
      {children}
    </div>
  )
}
