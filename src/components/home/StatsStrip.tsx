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
    <div className="grid grid-cols-3 gap-8">
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="text-[2.25rem] font-medium leading-none tracking-tight">
            {stat.value}
          </div>
          <div className="mt-3.5 text-[0.6875rem] font-medium uppercase tracking-[0.10em] text-muted-foreground">
            {stat.label}
          </div>
          {(stat.meta || stat.metaAccent) && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              {stat.metaAccent && (
                <span className="font-medium text-success">{stat.metaAccent}{stat.meta ? ' ' : ''}</span>
              )}
              {stat.meta}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
