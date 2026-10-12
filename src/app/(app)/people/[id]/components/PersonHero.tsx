import { BrandBlob } from '@/components/brand/blob'
import { MemberAvatar } from '@/components/brand/member-avatar'
import { SIDE_LABELS, type Side } from '@/lib/side'

interface PersonHeroProps {
  name: string
  avatarUrl?: string | null
  side?: Side
  /** Names of the roles this person holds now. */
  roles: string[]
}

/**
 * The top of a person's page (redesign direction B, "Obsidian"): one Deep
 * Obsidian card, the page's single dark block, with their avatar, name, side
 * and current roles. The name is the page's only Boldonse. The shapes mix both
 * sides of the palette, as on Home, so the card never reads as one side.
 */
export function PersonHero({ name, avatarUrl, side, roles }: PersonHeroProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-brand-obsidian text-brand-snow">
      <BrandBlob
        shape="ripple"
        rotate={-20}
        className="absolute -right-16 -top-24 -z-10 size-64 text-brand-jade sm:size-80"
      />
      <BrandBlob
        shape="pebble"
        rotate={10}
        className="absolute -bottom-12 right-6 -z-10 size-20 text-brand-buttercup sm:-bottom-10 sm:right-32 sm:size-24"
      />

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-10">
        <MemberAvatar
          name={name}
          src={avatarUrl}
          side={side ?? 'general'}
          size="xl"
          decorative
          className="ring-4 ring-brand-snow/20"
        />

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            {side && (
              <p className="ym-eyebrow text-sm text-brand-buttercup">{SIDE_LABELS[side]}</p>
            )}
            <h1 className="ym-h1 break-words">{name}</h1>
          </div>

          {roles.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Current roles">
              {roles.map((role, i) => (
                <li
                  key={`${role}-${i}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold"
                >
                  {role}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm font-semibold text-brand-snow/80">No current roles</p>
          )}
        </div>
      </div>
    </section>
  )
}
