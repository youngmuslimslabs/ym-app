import { Figtree } from 'next/font/google'

// Figtree is scoped to approved feature layouts; legacy routes retain their face.
export const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
  preload: false,
})
