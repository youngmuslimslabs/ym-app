import { BrandBlob } from '@/components/brand/blob'

interface Stat {
  label: string
  value: string | number
  meta?: string
  metaAccent?: string
}

interface StatsStripProps {
  stats: [Stat, Stat, Stat]
}

/** Three network numbers on a tinted panel, figures set in Boldonse. */
export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl bg-secondary p-6 sm:p-8">
      <BrandBlob
        shape="bloom"
        rotate={15}
        className="absolute -right-16 -top-20 -z-10 size-56 text-primary/[0.06]"
      />
      {/* Phones: one row per stat (three columns leave labels ~85px wide).
          From sm: three columns. */}
      <div className="grid grid-cols-1 divide-y divide-primary/10 sm:grid-cols-3 sm:gap-8 sm:divide-y-0">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 items-center gap-5 py-3 first:pt-0 last:pb-0 sm:block sm:py-0"
          >
            <div className="w-20 shrink-0 font-display text-[clamp(1.75rem,1.2rem+2vw,2.75rem)] leading-tight text-primary sm:w-auto">
              {stat.value}
            </div>
            <div className="min-w-0">
              <div className="ym-eyebrow text-muted-foreground sm:mt-2">{stat.label}</div>
              {(stat.meta || stat.metaAccent) && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {stat.metaAccent && (
                    <span className="font-semibold text-success">{stat.metaAccent}{stat.meta ? ' ' : ''}</span>
                  )}
                  {stat.meta}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
