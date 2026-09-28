import { ArrowRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { BrandBlob } from '@/components/brand/blob'
import { Logo } from '@/components/brand/logo'
import { MemberAvatar } from '@/components/brand/member-avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SAMPLE_ACTIONS, SAMPLE_CONFERENCE, SAMPLE_MEMBER, SAMPLE_STATS } from './sample'

// Home variations. Rules shared by all three, from Omar's feedback:
// - Boldonse appears once, on the member's name. Section titles, card titles
//   and figures are Figtree.
// - The member's side colour is an accent (buttons, active nav, avatar), not
//   the surface of the page.

const m = SAMPLE_MEMBER
const c = SAMPLE_CONFERENCE

function Place({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-1.5 text-sm', className)}>
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      {m.neighborNet} · {m.subregion}
    </p>
  )
}

function Stats({ figureClassName }: { figureClassName?: string }) {
  return (
    <dl className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {SAMPLE_STATS.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:block sm:px-6 sm:py-0 sm:first:pl-0">
          <dt className="text-sm font-medium text-muted-foreground sm:order-2 sm:mt-1">{s.label}</dt>
          <dd className="flex flex-col items-end sm:items-start">
            <span className={cn('text-3xl font-bold tabular-nums leading-tight', figureClassName)}>{s.value}</span>
            {s.meta && <span className="text-xs text-muted-foreground">{s.meta}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* ------------------------------------------------------------------ A */

/** A: Warm Snow. No colour block; one warm shape behind the greeting. */
export function HomeA() {
  return (
    <div className="pb-16">
      <section className="relative isolate overflow-hidden">
        <BrandBlob shape="cloud" rotate={-14} className="absolute -right-40 -top-48 -z-10 size-[22rem] text-brand-buttercup/60 sm:-right-16 sm:-top-40 sm:size-[30rem]" />
        <BrandBlob shape="pebble" rotate={24} className="absolute right-[34%] top-6 -z-10 hidden size-14 text-brand-jade sm:block" />
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-16">
          <div className="flex items-center gap-4">
            <MemberAvatar name={m.name} size="lg" />
            <div className="min-w-0">
              <p className="ym-eyebrow text-muted-foreground">Assalamu alaykum,</p>
              <h1 className="ym-display">{m.firstName}.</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ul className="flex flex-wrap gap-2">
              {m.roles.map((r) => (
                <li key={r} className="rounded-full border bg-card px-3 py-1 text-sm font-semibold">{r}</li>
              ))}
            </ul>
            <Place className="text-muted-foreground" />
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 sm:px-10">
        <section className="relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl bg-brand-buttercup p-6 text-brand-obsidian sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <BrandBlob shape="ripple" rotate={20} className="absolute -bottom-20 -right-10 -z-10 size-56 text-white/30" />
          <div>
            <p className="ym-eyebrow">You&apos;re going</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{c.name}</h2>
            <p className="mt-1 text-brand-obsidian/75">{c.dates} · {c.place}</p>
          </div>
          <a href="#" className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-brand-obsidian px-5 text-sm font-semibold text-brand-snow">
            View schedule <ChevronRight className="size-4" aria-hidden="true" />
          </a>
        </section>

        <section className="space-y-4">
          <h2 className="ym-h2">Jump back in</h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {SAMPLE_ACTIONS.map(({ href, icon: Icon, title, description }) => (
              <a key={title} href={href} className="group flex min-h-16 items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ym-h2">Across the network</h2>
          <div className="rounded-2xl border bg-card p-6"><Stats /></div>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ B */

const TINTS = [
  'bg-brand-jade/15 text-brand-jade',
  'bg-brand-brass/20 text-warning',
  'bg-brand-sky/15 text-brand-royal',
]

/** B: Obsidian. One dark neutral block, inset as a card; light sidebar. */
export function HomeB() {
  return (
    <div className="pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6">
        <section className="relative isolate overflow-hidden rounded-3xl bg-brand-obsidian text-brand-snow">
          <BrandBlob shape="ripple" rotate={-20} className="absolute -right-16 -top-24 -z-10 size-64 text-brand-jade sm:size-80" />
          <BrandBlob shape="pebble" rotate={10} className="absolute -bottom-14 -right-6 -z-10 size-24 text-brand-buttercup sm:-bottom-10 sm:right-40 sm:size-28" />
          <BrandBlob shape="bloom" className="absolute bottom-16 right-8 -z-10 hidden size-14 text-brand-sky sm:block" />
          <div className="flex flex-col gap-8 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-10">
            <div className="min-w-0 space-y-5">
              <div>
                <p className="ym-eyebrow text-brand-snow/65">Assalamu alaykum,</p>
                <h1 className="ym-display mt-1">{m.firstName}.</h1>
              </div>
              <ul className="flex flex-wrap gap-2">
                {m.roles.map((r) => (
                  <li key={r} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">{r}</li>
                ))}
              </ul>
              <Place className="text-brand-snow/70" />
            </div>
            <div className="hidden shrink-0 flex-col items-start gap-2 sm:flex">
              <Logo variant="stacked" className="h-14 text-brand-snow" />
              <span className="ym-eyebrow text-sm text-brand-buttercup">{m.subregion}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 pt-10 sm:px-10">
        <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary">
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Oct</span>
            <span className="text-lg font-bold leading-none tabular-nums">8–10</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="ym-eyebrow text-success">You&apos;re going</p>
            <h2 className="mt-1 text-xl font-bold">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{c.place}</p>
          </div>
          <Button className="min-h-11 rounded-full px-5">View schedule</Button>
        </section>

        <section className="space-y-4">
          <h2 className="ym-h2">Jump back in</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {SAMPLE_ACTIONS.map(({ href, icon: Icon, title, description }, i) => (
              <a key={title} href={href} className="group flex min-h-16 items-center gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md sm:flex-col sm:items-start sm:gap-6 sm:p-5">
                <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', TINTS[i])}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{description}</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="ym-h2">Across the network</h2>
          <Stats />
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ C */

const BLOCKS = [
  { className: 'bg-brand-buttercup text-brand-obsidian', blob: 'text-white/35' },
  { className: 'bg-brand-jade text-white', blob: 'text-white/10' },
  { className: 'bg-brand-obsidian text-brand-snow', blob: 'text-white/[0.06]' },
]

/** C: Palette blocks. Shortcuts become solid brand panels (Brandbook p.14). */
export function HomeC() {
  return (
    <div className="pb-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pt-10 sm:px-10 sm:pt-14">
        <section className="flex items-end justify-between gap-6">
          <div className="min-w-0 space-y-4">
            <div>
              <p className="ym-eyebrow text-primary">Assalamu alaykum,</p>
              <h1 className="ym-display mt-1">{m.firstName}.</h1>
            </div>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{m.roles.join(' · ')}</span>
            </p>
            <Place className="text-muted-foreground" />
          </div>
          <MemberAvatar name={m.name} size="xl" className="hidden sm:inline-flex" />
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_ACTIONS.map(({ href, icon: Icon, title, description }, i) => (
            <a
              key={title}
              href={href}
              className={cn('group relative isolate flex min-h-28 flex-col justify-between gap-6 overflow-hidden rounded-3xl p-5 transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 sm:min-h-44 sm:p-6', BLOCKS[i].className)}
            >
              <BrandBlob shape={(['cloud', 'ripple', 'bloom'] as const)[i]} rotate={i * 50} className={cn('absolute -bottom-16 -right-12 -z-10 size-48', BLOCKS[i].blob)} />
              <div className="flex items-center justify-between">
                <Icon className="size-6" aria-hidden="true" />
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-xl font-bold">{title}</span>
                <span className="block text-sm opacity-80">{description}</span>
              </div>
            </a>
          ))}
        </section>

        <section className="relative isolate flex flex-col gap-4 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <BrandBlob shape="pebble" className="absolute -right-10 -top-16 -z-10 size-44 text-white/10" />
          <div className="flex items-center gap-4">
            <CalendarDays className="size-8 shrink-0 opacity-80" aria-hidden="true" />
            <div>
              <p className="text-sm opacity-80">You&apos;re going · {c.dates}</p>
              <h2 className="text-2xl font-bold">{c.name}</h2>
            </div>
          </div>
          <a href="#" className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full bg-primary-foreground px-5 text-sm font-semibold text-primary">
            View schedule <ChevronRight className="size-4" aria-hidden="true" />
          </a>
        </section>

        <section className="space-y-4">
          <h2 className="ym-h2">Across the network</h2>
          <Stats figureClassName="text-foreground" />
        </section>
      </div>
    </div>
  )
}
