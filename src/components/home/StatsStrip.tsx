interface Stat {
  label: string
  value: string | number
  meta?: string
  metaAccent?: string
}

interface StatsStripProps {
  stats: [Stat, Stat, Stat]
}

/**
 * Three network numbers in a plain divided row. Figures are Figtree Bold, not
 * Boldonse (redesign direction B keeps Boldonse to the member's name).
 */
export function StatsStrip({ stats }: StatsStripProps) {
  return (
    // Phones: one row per stat (three columns leave labels ~85px wide).
    // From sm: three columns.
    <dl className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:block sm:px-6 sm:py-0 sm:first:pl-0"
        >
          <dt className="text-sm font-medium text-muted-foreground sm:order-2 sm:mt-1">{stat.label}</dt>
          <dd className="flex flex-col items-end sm:items-start">
            <span className="text-3xl font-bold leading-tight tabular-nums">{stat.value}</span>
            {(stat.meta || stat.metaAccent) && (
              <span className="text-xs text-muted-foreground">
                {stat.metaAccent && (
                  <span className="font-semibold text-success">{stat.metaAccent}{stat.meta ? ' ' : ''}</span>
                )}
                {stat.meta}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
