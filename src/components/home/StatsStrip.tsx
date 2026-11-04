interface Stat {
  label: string
  value: string | number
  meta?: string
  metaAccent?: string
}

interface StatsStripProps {
  stats: [Stat, Stat, Stat]
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-w-0 flex-col-reverse gap-1 rounded-2xl border bg-brand-buttercup p-4 text-brand-obsidian last:col-span-2 sm:last:col-span-1"
        >
          <dt className="text-xs">{stat.label}</dt>
          <dd className="flex flex-col items-start">
            <span className="text-[22px] font-bold leading-tight tabular-nums">{stat.value}</span>
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
