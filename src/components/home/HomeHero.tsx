interface HomeHeroProps {
  fullName: string
  roles: string[]
  neighborNet: string | null
  subregion: string | null
}

/** Desktop identity summary; the greeting and event carry the main hierarchy. */
export function HomeHero({ roles, neighborNet, subregion }: HomeHeroProps) {
  const place = [neighborNet, subregion].filter(Boolean).join(' · ')
  return <section className={roles.length ? "hidden space-y-3 lg:block" : "space-y-3"} aria-labelledby="home-identity">
    <h2 id="home-identity" className="text-lg font-medium">Who you are</h2>
    <div className="space-y-3 rounded-3xl border bg-card p-6">
      {roles.length ? <ul className="flex flex-wrap gap-2" aria-label="Your roles">{roles.map(role => <li key={role} className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">{role}</li>)}</ul> : <p className="text-sm">No roles yet</p>}
      <p className="text-muted-foreground">{place || 'No NeighborNet yet'}</p>
    </div>
  </section>
}
