import { Boldonse, Figtree } from 'next/font/google'

// The brand faces load here, not in the root layout, so they are only
// downloaded on /design-system and no existing screen changes typeface. Moving
// them to the root layout is part of rolling the brand out app-wide, which is
// a separate, reviewable step.

// Brand display face (Brandbook p.34). Single weight by design — headlines only.
const boldonse = Boldonse({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-boldonse',
  display: 'swap',
})

// Brand body face (Brandbook p.34). Variable; the book uses 400–900.
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
})

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
