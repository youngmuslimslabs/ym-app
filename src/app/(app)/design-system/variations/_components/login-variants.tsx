import { Logo } from '@/components/brand/logo'
import { BrandBlob, BrandWave } from '@/components/brand/blob'
import { SignInPanel } from './google-button-mock'

// Login variations. Each uses Boldonse once (the headline) and keeps blue to
// small accents. They cover the app shell, as the real /login has none.

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-background">{children}</div>
}

function Headline({ className }: { className?: string }) {
  return (
    <h1 className={`ym-display ${className ?? ''}`}>
      For the youth.
      <br />
      By the youth.
    </h1>
  )
}

const LEDE = 'Your Neighbor Net, your people and your next event, all in one place.'

/** A: Warm Snow. Light page, warm shapes, the sign-in panel as a white card. */
export function LoginA() {
  return (
    <Screen>
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <BrandBlob
          shape="cloud"
          rotate={-12}
          className="absolute -bottom-40 -right-40 -z-10 size-[30rem] text-brand-buttercup lg:-bottom-56 lg:-right-24 lg:size-[46rem]"
        />
        <BrandBlob
          shape="pebble"
          rotate={30}
          className="absolute -top-10 right-[18%] -z-10 hidden size-24 text-brand-jade lg:block"
        />
        <BrandBlob
          shape="ripple"
          className="absolute -left-24 top-1/3 -z-10 size-56 text-brand-obsidian/[0.04]"
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[1fr_24rem] lg:items-center lg:gap-16 lg:py-16">
          <div className="flex flex-col gap-10 lg:gap-16">
            <Logo variant="full" className="h-5 max-w-[16rem] text-foreground lg:h-6" />
            <div className="max-w-xl space-y-5">
              <Headline />
              <p className="max-w-md text-lg text-muted-foreground">{LEDE}</p>
            </div>
          </div>
          <SignInPanel className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8" />
        </div>
      </div>
    </Screen>
  )
}

/** B: Obsidian. Same split as today, but the block is neutral and the accents mix both sides. */
export function LoginB() {
  return (
    <Screen>
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <section className="relative isolate flex flex-col overflow-hidden bg-brand-obsidian text-brand-snow lg:min-h-dvh lg:flex-1">
          <BrandBlob shape="ripple" rotate={-18} className="absolute -bottom-24 -left-20 -z-10 size-72 text-brand-jade lg:size-[26rem]" />
          <BrandBlob shape="pebble" rotate={20} className="absolute -right-12 top-10 -z-10 size-40 text-brand-buttercup lg:size-56" />
          <BrandBlob shape="bloom" rotate={8} className="absolute bottom-24 right-[22%] -z-10 hidden size-24 text-brand-sky lg:block" />

          <div className="flex flex-1 flex-col gap-10 px-6 pb-16 pt-10 sm:px-10 lg:justify-between lg:p-14 xl:p-20">
            <Logo variant="full" className="h-5 max-w-[16rem] lg:h-6" />
            <div className="max-w-xl space-y-5">
              <Headline />
              <p className="max-w-md text-lg text-brand-snow/75">{LEDE}</p>
            </div>
            <p className="ym-eyebrow hidden text-brand-snow/55 lg:block">Brotherhood · Sisterhood · Deen</p>
          </div>
          <BrandWave className="-mb-px h-8 text-background lg:hidden" />
        </section>

        <section className="flex flex-1 items-start justify-center px-6 pb-12 pt-4 sm:px-10 lg:max-w-[34rem] lg:items-center lg:py-14">
          <SignInPanel className="w-full max-w-sm" />
        </section>
      </div>
    </Screen>
  )
}

/** C: Palette blocks. A band of four brand panels (Brandbook p.14) over a light page. */
export function LoginC() {
  const panels = [
    { className: 'bg-brand-royal text-white', logo: <Logo variant="full" side="general" className="h-4 max-w-[80%] lg:h-5" /> },
    { className: 'bg-brand-buttercup text-brand-forest', logo: <Logo variant="stacked" side="sisters" className="h-12 max-w-[70%] lg:h-16" /> },
    { className: 'bg-brand-forest text-white', logo: <Logo variant="full" side="sisters" className="h-4 max-w-[80%] lg:h-5" /> },
    { className: 'bg-brand-slate text-white', logo: <Logo variant="stacked" side="brothers" className="h-12 max-w-[70%] lg:h-16" /> },
  ]
  return (
    <Screen>
      <div className="flex min-h-dvh flex-col">
        <div className="grid h-40 grid-cols-4 sm:h-56 lg:h-[42vh]">
          {panels.map((p, i) => (
            <div key={i} className={`relative isolate flex items-center justify-center overflow-hidden ${p.className}`}>
              <BrandBlob shape={i % 2 ? 'cloud' : 'ripple'} rotate={i * 40} className="absolute -bottom-16 -right-12 -z-10 size-48 text-white/10" />
              <span className="hidden sm:contents">{p.logo}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[1fr_22rem] lg:items-center lg:gap-16 lg:py-14">
          <div className="max-w-xl space-y-5">
            <Logo variant="full" className="h-5 max-w-[16rem] text-foreground sm:hidden" />
            <Headline />
            <p className="max-w-md text-lg text-muted-foreground">{LEDE}</p>
          </div>
          <SignInPanel />
        </div>
      </div>
    </Screen>
  )
}
