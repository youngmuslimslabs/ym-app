import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type LogoVariant = 'mark' | 'full' | 'wordmark' | 'stacked'
const ASPECT: Record<LogoVariant, number> = {mark: 1586 / 716, full: 2636 / 256, wordmark: 2030 / 256, stacked: 1423 / 1227}

function maskStyle(variant: LogoVariant): CSSProperties {
  const url = `url(/brand/general/${variant}.svg)`
  return {
    aspectRatio: String(ASPECT[variant]),
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
  /**
   * Sets the height (e.g. `h-8`); width follows the logo's aspect ratio. Add a
   * max-width (e.g. `max-w-8`) to fit a fixed box — the logo scales down inside it.
   */
  className?: string
  label?: string
}

export function Logo({ variant = 'mark', className, label = 'Young Muslims' }: LogoProps) {
  return <span role="img" aria-label={label} className={cn('inline-flex h-6 shrink-0', className)}>
    <span aria-hidden="true" className="h-full max-w-full" style={maskStyle(variant)} />
  </span>
}
