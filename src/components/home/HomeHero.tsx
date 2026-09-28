import { BrandBlob, BrandWave } from '@/components/brand/blob'
import { LocalLockup } from '@/components/brand/local-lockup'
import { Greeting } from './Greeting'

interface HomeHeroProps {
  fullName: string
  roles: string[]
  neighborNet: string | null
  subregion: string | null
}

/**
 * The top of Home: a full-width colour block in the member's side colour
 * (Brandbook p.14, 43) with the greeting, who they are, and their local
 * lockup. It ends in a wave into the page.
 */
export function HomeHero({ fullName, roles, neighborNet, subregion }: HomeHeroProps) {
  const place = [neighborNet, subregion].filter(Boolean).join(' · ')

  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <BrandBlob
        shape="ripple"
        rotate={-24}
        className="absolute -right-28 -top-36 -z-10 size-[22rem] text-white/[0.07] sm:size-[30rem]"
      />
      <BrandBlob
        shape="cloud"
        rotate={40}
        className="absolute -bottom-40 -left-24 -z-10 size-80 text-white/[0.05]"
      />
      <BrandBlob
        shape="pebble"
        rotate={-8}
        className="absolute -bottom-3 right-[12%] -z-10 size-16 text-highlight sm:size-24"
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-12 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:pb-16 sm:pt-14">
        <div className="min-w-0 space-y-6">
          <Greeting fullName={fullName} />
          <div className="space-y-3">
            {roles.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Your roles">
                {roles.map((role) => (
                  <li
                    key={role}
                    className="rounded-full bg-white/[0.14] px-3 py-1 text-sm font-semibold"
                  >
                    {role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-primary-foreground/80">No roles yet</p>
            )}
            <p className="text-sm text-primary-foreground/75">{place || 'No NeighborNet yet'}</p>
          </div>
        </div>

        {subregion && (
          <LocalLockup
            place={subregion}
            className="hidden shrink-0 text-primary-foreground sm:inline-flex"
            placeClassName="text-highlight"
          />
        )}
      </div>

      <BrandWave className="-mb-px h-6 text-background sm:h-10" />
    </section>
  )
}
