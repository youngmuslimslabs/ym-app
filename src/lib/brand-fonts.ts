import { Boldonse, Figtree } from 'next/font/google'

// Brand display face (Brandbook p.34). Single weight by design — headlines only.
export const boldonse = Boldonse({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-boldonse',
  display: 'swap',
  // Not preloaded: a screen that hasn't opted into the brand shouldn't pay for
  // the files. The browser only fetches them once something uses the face.
  preload: false,
})

// Brand body face (Brandbook p.34). Variable; the book uses 400–900.
export const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-figtree',
  display: 'swap',
  preload: false,
})
