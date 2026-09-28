import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HomeA, HomeB, HomeC } from '../../_components/home-variants'
import { LoginA, LoginB, LoginC } from '../../_components/login-variants'
import { VARIANT_INFO, VARIANTS, type Variant } from '../../_components/sample'
import { SidebarToneSwitch, type SidebarTone } from '../../_components/sidebar-tone'

const SCREENS = {
  login: { a: LoginA, b: LoginB, c: LoginC },
  home: { a: HomeA, b: HomeB, c: HomeC },
} as const

// Which sidebar each Home variation is designed with.
const HOME_SIDEBAR: Record<Variant, SidebarTone> = { a: 'obsidian', b: 'light', c: 'themed' }

type Params = Promise<{ screen: string; variant: string }>

function resolve(screen: string, variant: string) {
  if (!(screen in SCREENS) || !(VARIANTS as readonly string[]).includes(variant)) return null
  return { screen: screen as keyof typeof SCREENS, variant: variant as Variant }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { screen, variant } = await params
  const r = resolve(screen, variant)
  if (!r) return {}
  return { title: `${r.screen === 'home' ? 'Home' : 'Login'} ${r.variant.toUpperCase()}: ${VARIANT_INFO[r.variant].name} — YM variations` }
}

export function generateStaticParams() {
  return Object.keys(SCREENS).flatMap((screen) => VARIANTS.map((variant) => ({ screen, variant })))
}

/** One design variation, with sample data. Index: /design-system/variations */
export default async function VariationPage({ params }: { params: Params }) {
  const { screen, variant } = await params
  const r = resolve(screen, variant)
  if (!r) notFound()
  const View = SCREENS[r.screen][r.variant]
  return (
    <>
      {r.screen === 'home' && <SidebarToneSwitch tone={HOME_SIDEBAR[r.variant]} />}
      <View />
    </>
  )
}
