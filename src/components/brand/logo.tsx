import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import type { Side } from '@/lib/side'

// Brand logos (Brandbook p.15–28), shipped as single-colour SVGs in
// /public/brand/{general,brothers,sisters}. They render as CSS masks filled
// with `currentColor`, so a logo always takes the surrounding text colour —
// white on the dark sidebar, Royal/Forest on light pages — with no per-colour
// asset.
//
// Which side's logo shows is decided by CSS, not JS: each theme block in
// globals.css sets --ym-logo-{general,brothers,sisters} to block/none. That
// works from first paint (the <head> script sets data-theme-side before
// hydration) and inside nested previews such as /design-system's theme cards.

export type LogoVariant = 'mark' | 'full' | 'wordmark' | 'stacked'
type LogoSide = Side | 'general'

const LOGO_SIDES: LogoSide[] = ['general', 'brothers', 'sisters']

// viewBox width / height of each source SVG
const ASPECT: Record<LogoVariant, Record<LogoSide, number>> = {
  mark: { general: 1586 / 716, brothers: 1, sisters: 1 },
  full: { general: 2636 / 256, brothers: 1882 / 206, sisters: 1882 / 206 },
  wordmark: { general: 2030 / 256, brothers: 1665 / 208, sisters: 1666 / 207 },
  stacked: { general: 1423 / 1227, brothers: 1083 / 583, sisters: 1084 / 583 },
}

const SHOW_CLASS: Record<LogoSide, string> = {
  general: 'ym-logo-general',
  brothers: 'ym-logo-brothers',
  sisters: 'ym-logo-sisters',
}

function maskStyle(variant: LogoVariant, side: LogoSide): CSSProperties {
  const url = `url(/brand/${side}/${variant}.svg)`
  return {
    aspectRatio: String(ASPECT[variant][side]),
    backgroundColor: 'currentColor',
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  }
}

interface LogoProps {
  variant?: LogoVariant
  /** Pin one side's logo. Omit to follow the active theme. */
  side?: LogoSide
  /**
   * Sets the height (e.g. `h-8`); width follows the logo's aspect ratio. Add a
   * max-width (e.g. `max-w-8`) to fit a fixed box — the logo scales down inside it.
   */
  className?: string
  label?: string
}

export function Logo({ variant = 'mark', side, className, label = 'Young Muslims' }: LogoProps) {
  const sides = side ? [side] : LOGO_SIDES
  return (
    <span role="img" aria-label={label} className={cn('inline-flex h-6 shrink-0', className)}>
      {sides.map((s) => (
        <span
          key={s}
          aria-hidden="true"
          className={cn('h-full max-w-full', !side && SHOW_CLASS[s])}
          style={maskStyle(variant, s)}
        />
      ))}
    </span>
  )
}
