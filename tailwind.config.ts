import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Figtree is the body face for everything; Boldonse is headlines only.
        sans: ['var(--font-figtree)', 'system-ui', 'sans-serif'],
        display: ['var(--font-boldonse)', 'var(--font-figtree)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      letterSpacing: {
        // Brandbook p.34 specifies -2% tracking on both faces.
        brand: '-0.02em',
      },
      /**
       * Type scale (Brandbook p.35). Use it through the `.ym-*` classes in
       * globals.css, which also set the face, weight and case; a size on its
       * own is only half of a level.
       *
       * Boldonse's caps are taller than its em (64px set is about 75px of cap),
       * so its levels need a line-height near 1.3 just to keep lines from
       * touching, and are sized smaller than a Figtree scale would be.
       */
      fontSize: {
        display: ['clamp(2.25rem, 1.4rem + 3vw, 3.75rem)', { lineHeight: '1.3' }],
        h1: ['clamp(1.5rem, 1.25rem + 1.1vw, 2rem)', { lineHeight: '1.32' }],
        h2: ['1.375rem', { lineHeight: '1.3' }],
        h3: ['1.0625rem', { lineHeight: '1.4' }],
        eyebrow: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(var(--card) / <alpha-value>)',
          foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
          foreground: 'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'oklch(var(--success) / <alpha-value>)',
          foreground: 'oklch(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
          foreground: 'oklch(var(--warning-foreground) / <alpha-value>)',
        },
        highlight: {
          DEFAULT: 'oklch(var(--highlight) / <alpha-value>)',
          foreground: 'oklch(var(--highlight-foreground) / <alpha-value>)',
        },

        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
        chart: {
          '1': 'oklch(var(--chart-1) / <alpha-value>)',
          '2': 'oklch(var(--chart-2) / <alpha-value>)',
          '3': 'oklch(var(--chart-3) / <alpha-value>)',
          '4': 'oklch(var(--chart-4) / <alpha-value>)',
          '5': 'oklch(var(--chart-5) / <alpha-value>)',
        },
        /**
         * Sidebar tokens moved from their own HSL system onto OKLCH, matching
         * every other token. Side effect worth knowing: these now support
         * Tailwind opacity modifiers — `text-sidebar-foreground/70` was
         * silently a no-op under plain `hsl(var(--x))` and now actually works.
         */
        sidebar: {
          DEFAULT: 'oklch(var(--sidebar-background) / <alpha-value>)',
          foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'oklch(var(--sidebar-border) / <alpha-value>)',
          ring: 'oklch(var(--sidebar-ring) / <alpha-value>)',
        },

        /**
         * Literal brand palette (Brandbook pp.30–32). Fixed values, NOT themed —
         * these are the exact brand colors and must not shift between light and
         * dark. For UI, prefer the semantic tokens above (primary, background,
         * …) which are built from these; reach for `brand-*` only when you need
         * a specific brand color by name (e.g. a Brothers/Sisters treatment).
         * Written with <alpha-value> so opacity modifiers (`bg-brand-jade/15`)
         * work; without it Tailwind silently drops those classes.
         */
        brand: {
          // General palette — the app's foundation
          obsidian: 'oklch(0.2118 0.0275 283.806 / <alpha-value>)', // #171725 Deep Obsidian
          snow: 'oklch(0.9861 0.0034 67.784 / <alpha-value>)', //     #FCFAF8 Warm Snow
          royal: 'oklch(0.3865 0.1137 263.626 / <alpha-value>)', //   #234080 Royal Blue
          jade: 'oklch(0.5089 0.0839 155.775 / <alpha-value>)', //    #397451 Jade Foliage
          // Brothers palette
          midnight: 'oklch(0.2875 0.074 262.653 / <alpha-value>)', // #16294F Midnight Blue
          sky: 'oklch(0.641 0.1309 251.419 / <alpha-value>)', //      #4A90D9 Sky Blue
          slate: 'oklch(0.7413 0.0451 255.956 / <alpha-value>)', //   #99ADC8 Cool Slate
          // Sisters palette
          forest: 'oklch(0.2824 0.0565 164.37 / <alpha-value>)', //   #043222 Deep Forest Green
          buttercup: 'oklch(0.8618 0.1448 97.929 / <alpha-value>)', //#EBD255 Buttercup Yellow
          brass: 'oklch(0.7617 0.1283 83.979 / <alpha-value>)', //    #D8AA45 Warm Brass
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config

export default config
