import { cn } from '@/lib/utils'

// Organic shapes (Brandbook p.2, 6, 7, 11, 41–42). The book draws these by
// hand with the pen tool and ships no files, so these are generated outlines
// in the same spirit: soft, rounded, a little irregular. They fill with
// `currentColor`, so colour and opacity come from a text class and follow the
// theme — `text-primary/10` for a tint, `text-brand-sky` for a solid accent.
//
// Decorative only: always aria-hidden, and position them yourself
// (absolute + a size). A shape bleeding off the edge of a colour block reads
// more like the book than one floating in the middle.

export type BlobShape = 'pebble' | 'ripple' | 'cloud' | 'bloom'

// viewBox 0 0 200 200
const BLOB_PATHS: Record<BlobShape, string> = {
  pebble:
    'M186.9 100.0C188.0 109.6 186.1 120.9 182.4 130.0C178.6 139.0 171.6 147.5 164.6 154.2C157.6 160.9 148.9 166.0 140.4 170.1C132.0 174.1 122.8 177.0 113.8 178.3C104.8 179.5 95.0 179.5 86.3 177.6C77.6 175.6 68.8 171.5 61.6 166.5C54.5 161.4 48.5 154.3 43.5 147.4C38.4 140.5 34.7 133.0 31.1 125.1C27.6 117.2 24.1 109.1 22.2 100.0C20.2 90.9 18.1 80.5 19.4 70.7C20.7 60.8 23.9 49.2 29.9 41.2C35.8 33.1 45.7 25.6 55.0 22.1C64.3 18.5 76.3 18.7 85.9 19.9C95.4 21.2 104.4 26.0 112.4 29.5C120.4 33.1 126.7 37.4 133.8 41.4C140.9 45.4 148.2 48.6 155.1 53.7C162.1 58.9 170.4 64.8 175.7 72.5C181.0 80.2 185.8 90.4 186.9 100.0Z',
  ripple:
    'M188.3 100.0C189.8 109.8 189.8 122.6 185.0 130.9C180.2 139.3 167.4 144.1 159.7 150.1C152.0 156.1 146.3 162.3 138.7 167.0C131.1 171.7 122.4 177.7 113.8 178.4C105.3 179.2 96.1 173.4 87.4 171.5C78.7 169.5 69.7 170.0 61.4 166.9C53.1 163.7 42.8 159.3 37.5 152.5C32.1 145.6 32.4 134.6 29.1 125.8C25.7 117.1 19.8 109.4 17.5 100.0C15.3 90.6 12.4 78.2 15.6 69.3C18.7 60.4 29.2 53.4 36.3 46.6C43.5 39.7 50.1 32.2 58.4 27.9C66.7 23.7 77.2 20.0 86.1 21.0C95.0 21.9 103.4 30.8 111.7 33.7C120.0 36.5 127.3 35.8 135.7 38.2C144.1 40.5 155.4 42.2 162.1 47.9C168.8 53.6 171.5 63.7 175.8 72.4C180.2 81.1 186.8 90.2 188.3 100.0Z',
  cloud:
    'M193.9 100.0C195.5 110.0 192.1 122.7 187.2 131.7C182.3 140.8 172.7 148.4 164.6 154.2C156.4 159.9 147.0 163.6 138.3 166.3C129.6 168.9 120.7 169.5 112.3 169.9C103.9 170.3 96.1 169.9 87.8 168.9C79.6 167.9 70.9 167.2 63.0 164.0C55.2 160.8 47.2 155.8 40.7 149.8C34.2 143.7 29.0 136.0 23.9 127.7C18.8 119.4 12.3 110.1 9.9 100.0C7.6 89.9 5.7 76.4 9.6 67.1C13.5 57.8 24.3 49.0 33.4 44.1C42.5 39.2 54.9 39.7 63.9 37.5C73.0 35.4 79.7 33.1 87.9 31.2C96.0 29.4 104.8 25.5 113.0 26.4C121.1 27.2 129.6 31.9 136.7 36.4C143.8 40.9 148.9 47.4 155.8 53.2C162.7 59.1 171.7 63.8 178.1 71.6C184.4 79.4 192.4 90.0 193.9 100.0Z',
  bloom:
    'M188.5 100.0C190.0 109.5 187.3 121.7 182.5 130.0C177.6 138.3 166.2 143.0 159.3 149.7C152.3 156.4 148.3 166.1 140.6 170.3C132.9 174.4 122.3 173.1 113.2 174.7C104.1 176.3 95.1 180.2 85.9 180.0C76.7 179.7 64.8 178.6 57.7 173.2C50.6 167.8 48.3 155.4 43.3 147.6C38.2 139.8 30.3 134.3 27.5 126.4C24.7 118.5 27.0 108.9 26.6 100.0C26.2 91.1 24.6 82.6 25.1 72.7C25.5 62.8 24.0 48.6 29.3 40.7C34.7 32.8 47.7 29.7 57.0 25.5C66.3 21.3 75.8 15.4 85.1 15.7C94.4 16.0 104.8 22.9 112.8 27.3C120.8 31.8 125.5 38.6 133.2 42.5C140.9 46.4 152.3 45.4 159.0 50.5C165.7 55.6 168.6 65.0 173.5 73.2C178.4 81.5 187.0 90.5 188.5 100.0Z',
}

interface BrandBlobProps {
  shape?: BlobShape
  className?: string
  /** Degrees. Reuse one shape at a few angles instead of adding new ones. */
  rotate?: number
}

export function BrandBlob({ shape = 'pebble', className, rotate }: BrandBlobProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none select-none', className)}
      style={rotate === undefined ? undefined : { transform: `rotate(${rotate}deg)` }}
    >
      <path fill="currentColor" d={BLOB_PATHS[shape]} />
    </svg>
  )
}

interface BrandWaveProps {
  className?: string
  /** Mirror left-to-right, so stacked waves don't line up. */
  flip?: boolean
}

/**
 * A soft wavy edge for the bottom of a colour block (Brandbook p.42). Place it
 * at the block's bottom edge, coloured like the surface *below* it
 * (`text-background`), so the block appears to end in a curve.
 */
export function BrandWave({ className, flip }: BrandWaveProps) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn('pointer-events-none block w-full select-none', flip && '-scale-x-100', className)}
    >
      <path
        fill="currentColor"
        d="M0 34C180 70 360 78 560 52S900 0 1100 14 1360 58 1440 44V80H0Z"
      />
    </svg>
  )
}
