import { MapPin } from 'lucide-react'

import { BrandBlob } from '@/components/brand/blob'
import { Logo } from '@/components/brand/logo'
import { Greeting } from './Greeting'

interface HomeHeroProps {
  fullName: string
  roles: string[]
  neighborNet: string | null
  subregion: string | null
}

/**
 * The top of Home (redesign direction B, "Obsidian"): one Deep Obsidian card,
 * the page's single dark block, with the greeting, who they are, and their
 * local lockup. The member's name is the only Boldonse on the page, and the
 * shapes mix both sides of the palette so the card isn't the side colour.
 */
export function HomeHero({ fullName, roles, neighborNet, subregion }: HomeHeroProps) {
  const place = [neighborNet, subregion].filter(Boolean).join(' · ')

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
      <section className="relative isolate overflow-hidden rounded-3xl bg-brand-obsidian text-brand-snow">
        <BrandBlob
          shape="ripple"
          rotate={-20}
          className="absolute -right-16 -top-24 -z-10 size-64 text-brand-jade sm:size-80"
        />
        <BrandBlob
          shape="pebble"
          rotate={10}
          className="absolute -bottom-14 -right-6 -z-10 size-24 text-brand-buttercup sm:-bottom-10 sm:right-40 sm:size-28"
        />
        <BrandBlob
          shape="bloom"
          className="absolute bottom-16 right-8 -z-10 hidden size-14 text-brand-sky sm:block"
        />

        <div className="flex flex-col gap-8 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
          <div className="min-w-0 space-y-5">
            <Greeting fullName={fullName} />
            {roles.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="Your roles">
                {roles.map((role) => (
                  <li key={role} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                    {role}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-brand-snow/80">No roles yet</p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-brand-snow/70">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {place || 'No NeighborNet yet'}
            </p>
          </div>

          {subregion && (
            <div className="hidden shrink-0 flex-col items-start gap-2 sm:flex">
              <Logo variant="stacked" className="h-14 text-brand-snow" />
              <span className="ym-eyebrow text-sm text-brand-buttercup">{subregion}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
