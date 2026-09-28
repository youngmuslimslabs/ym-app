import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { VARIANT_INFO, VARIANTS } from './_components/sample'

export const metadata: Metadata = {
  title: 'Design variations — Young Muslims App',
}

/**
 * Index of the Login and Home design variations (redesign pass 2), made in
 * response to review feedback on pass 1. Sample data only. Delete this folder
 * once a direction is chosen and built into the real screens.
 */
export default function VariationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-4 pb-20 sm:p-6">
      <PageHeader
        back={{ href: '/design-system', label: 'Design system' }}
        eyebrow="Redesign pass 2"
        title="Variations"
        description="Three directions for Login and Home. Each uses Boldonse once per screen and keeps the side colour to accents, in response to feedback that pass 1 used the display font too much and felt too blue."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {VARIANTS.map((v) => (
          <section key={v} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
            <div className="space-y-1">
              <p className="ym-eyebrow text-primary">Variation {v.toUpperCase()}</p>
              <h2 className="ym-h2">{VARIANT_INFO[v].name}</h2>
            </div>
            <p className="flex-1 text-sm text-muted-foreground">{VARIANT_INFO[v].summary}</p>
            <div className="flex gap-4 text-sm font-semibold">
              <Link className="text-primary underline-offset-4 hover:underline" href={`/design-system/variations/login/${v}`}>Login</Link>
              <Link className="text-primary underline-offset-4 hover:underline" href={`/design-system/variations/home/${v}`}>Home</Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
