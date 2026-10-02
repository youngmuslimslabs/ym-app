import type { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Design System — Young Muslims App',
  description: 'Brand tokens and component reference for the YM app',
}

/**
 * Living reference for the YM design system, built from the 2026 Brandbook.
 *
 * This page is the agreement point: change a token in globals.css or
 * tailwind.config.ts and this page shows the result everywhere at once. Add a
 * component here when you add it to the app, so there is one place to see what
 * exists before building something new.
 */

interface Swatch {
  name: string
  hex: string
  /** Tailwind background class */
  className: string
  /** Text color that stays legible on the swatch */
  onClassName: string
  note?: string
}

const GENERAL: Swatch[] = [
  {
    name: 'Deep Obsidian',
    hex: '#171725',
    className: 'bg-brand-obsidian',
    onClassName: 'text-brand-snow',
    note: 'Foundation — page text, dark surfaces',
  },
  {
    name: 'Warm Snow',
    hex: '#FCFAF8',
    className: 'bg-brand-snow',
    onClassName: 'text-brand-obsidian',
    note: 'Foundation — app background',
  },
  {
    name: 'Royal Blue',
    hex: '#234080',
    className: 'bg-brand-royal',
    onClassName: 'text-brand-snow',
    note: 'Signature — from the Brothers palette',
  },
  {
    name: 'Jade Foliage',
    hex: '#397451',
    className: 'bg-brand-jade',
    onClassName: 'text-brand-snow',
    note: 'Accent — from the Sisters palette',
  },
]

const BROTHERS: Swatch[] = [
  {
    name: 'Midnight Blue',
    hex: '#16294F',
    className: 'bg-brand-midnight',
    onClassName: 'text-brand-snow',
  },
  {
    name: 'Royal Blue',
    hex: '#234080',
    className: 'bg-brand-royal',
    onClassName: 'text-brand-snow',
  },
  {
    name: 'Sky Blue',
    hex: '#4A90D9',
    className: 'bg-brand-sky',
    onClassName: 'text-brand-obsidian',
    note: 'Fills and accents — not small type',
  },
  {
    name: 'Cool Slate',
    hex: '#99ADC8',
    className: 'bg-brand-slate',
    onClassName: 'text-brand-obsidian',
    note: 'Fills and accents — not small type',
  },
]

const SISTERS: Swatch[] = [
  {
    name: 'Deep Forest Green',
    hex: '#043222',
    className: 'bg-brand-forest',
    onClassName: 'text-brand-snow',
  },
  {
    name: 'Jade Foliage',
    hex: '#397451',
    className: 'bg-brand-jade',
    onClassName: 'text-brand-snow',
  },
  {
    name: 'Buttercup Yellow',
    hex: '#EBD255',
    className: 'bg-brand-buttercup',
    onClassName: 'text-brand-obsidian',
    note: 'Never small type on white',
  },
  {
    name: 'Warm Brass',
    hex: '#D8AA45',
    className: 'bg-brand-brass',
    onClassName: 'text-brand-obsidian',
    note: 'Never small type on white',
  },
]

const SEMANTIC: Swatch[] = [
  { name: 'background', hex: 'Warm Snow', className: 'bg-background', onClassName: 'text-foreground' },
  { name: 'foreground', hex: 'Deep Obsidian', className: 'bg-foreground', onClassName: 'text-background' },
  { name: 'card', hex: 'Pure White', className: 'bg-card', onClassName: 'text-card-foreground' },
  { name: 'primary', hex: 'Royal Blue', className: 'bg-primary', onClassName: 'text-primary-foreground' },
  { name: 'secondary', hex: 'Warm Snow −', className: 'bg-secondary', onClassName: 'text-secondary-foreground' },
  { name: 'muted', hex: 'Warm Snow −', className: 'bg-muted', onClassName: 'text-muted-foreground' },
  { name: 'accent', hex: 'Warm Snow −', className: 'bg-accent', onClassName: 'text-accent-foreground' },
  { name: 'success', hex: 'Jade Foliage', className: 'bg-success', onClassName: 'text-success-foreground' },
  { name: 'warning', hex: 'Brass, darkened', className: 'bg-warning', onClassName: 'text-warning-foreground' },
  { name: 'destructive', hex: 'no brand value', className: 'bg-destructive', onClassName: 'text-destructive-foreground' },
  { name: 'border', hex: 'Warm Snow −−', className: 'bg-border', onClassName: 'text-foreground' },
]

const SIDEBAR: Swatch[] = [
  { name: 'sidebar', hex: 'Deep Obsidian', className: 'bg-sidebar', onClassName: 'text-sidebar-foreground' },
  { name: 'sidebar-primary', hex: 'Royal Blue, lifted', className: 'bg-sidebar-primary', onClassName: 'text-sidebar-primary-foreground' },
  { name: 'sidebar-accent', hex: 'hover state', className: 'bg-sidebar-accent', onClassName: 'text-sidebar-accent-foreground' },
  { name: 'sidebar-border', hex: 'divider', className: 'bg-sidebar-border', onClassName: 'text-sidebar-foreground' },
]

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {swatches.map((s) => (
        <div key={`${s.name}-${s.hex}`} className="overflow-hidden rounded-lg border">
          <div className={`${s.className} ${s.onClassName} flex h-24 items-end p-3`}>
            <span className="font-mono text-xs">{s.hex}</span>
          </div>
          <div className="space-y-1 bg-card p-3">
            <p className="text-sm font-semibold">{s.name}</p>
            {s.note ? (
              <p className="text-xs text-muted-foreground">{s.note}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Renders the same small UI under one of the three themes. The General theme
 * lives on `:root`, so it is the variant with no `data-side` attribute.
 */
function ThemePreview({
  name,
  anchor,
  side,
}: {
  name: string
  anchor: string
  side?: 'brothers' | 'sisters'
}) {
  return (
    <div
      data-side={side}
      className="overflow-hidden rounded-lg border bg-background"
    >
      {/* Stand-in for the sidebar, which is this theme's anchor color */}
      <div className="flex items-center gap-2 bg-sidebar px-4 py-3">
        <div className="size-2 rounded-full bg-sidebar-primary" />
        <span className="text-sm font-semibold text-sidebar-foreground">
          {name}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm text-foreground">
          Anchor: <span className="font-mono text-xs">{anchor}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Muted supporting copy sits here.
        </p>
        <div className="rounded-md bg-card p-3 text-sm shadow-sm">
          A card on the page background.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Badge variant="success">Success</Badge>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

/** One row of the type scale, with the classes that produce it. */
function TypeRow({
  label,
  classes,
  children,
}: {
  label: string
  classes: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 border-b py-5 last:border-b-0 md:grid-cols-[14rem_1fr] md:gap-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <code className="block font-mono text-xs text-muted-foreground">{classes}</code>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 p-4 pb-20 sm:p-6">
      <header className="space-y-2">
        <Badge variant="info">Brandbook 2026</Badge>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Design System
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Every color, typeface, and component the app is built from. Tokens
          come from the Young Muslims Brandbook — change one in{' '}
          <code className="font-mono text-xs">globals.css</code> and everything
          here updates with it.
        </p>
      </header>

      <Section
        title="Themes"
        description="Three complete themes, each anchored on its palette's darkest base. Set data-side='brothers' or 'sisters' on any element to theme it and everything inside. Nothing sets this automatically yet — the users table has no side field."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <ThemePreview name="General" anchor="Deep Obsidian #171725" />
          <ThemePreview
            name="Brothers"
            anchor="Midnight Blue #16294F"
            side="brothers"
          />
          <ThemePreview
            name="Sisters"
            anchor="Deep Forest Green #043222"
            side="sisters"
          />
        </div>
      </Section>

      <Section
        title="General palette"
        description="For anything representing Young Muslims as a whole. Obsidian and Warm Snow are the base; blue and green signal the two sides united. (Brandbook p.30)"
      >
        <SwatchGrid swatches={GENERAL} />
      </Section>

      <Section
        title="Brothers palette"
        description="For content speaking to or about the brothers' side. Lead with the deeper blues; Sky Blue where you want energy. (Brandbook p.31)"
      >
        <SwatchGrid swatches={BROTHERS} />
      </Section>

      <Section
        title="Sisters palette"
        description="For content speaking to or about the sisters' side. Lead with the greens; Buttercup and Brass for warmth. (Brandbook p.32)"
      >
        <SwatchGrid swatches={SISTERS} />
      </Section>

      <Section
        title="Semantic tokens"
        description="What the UI actually uses. These are built from the brand palette — prefer them over brand-* so every theme works."
      >
        <SwatchGrid swatches={SEMANTIC} />
      </Section>

      <Section
        title="Sidebar tokens"
        description="The sidebar is the app's branded dark surface and re-colors with the active theme. These moved off a separate HSL system onto OKLCH, so opacity modifiers now work on them."
      >
        <SwatchGrid swatches={SIDEBAR} />
      </Section>

      <Separator />

      <Section
        title="Typography"
        description="Boldonse carries headlines; Figtree handles everything beneath, shifting weight to signal each level. Both set at -2% tracking. (Brandbook pp.34–35)"
      >
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <TypeRow label="H1 — Headlines" classes="font-display text-4xl">
            <p className="font-display text-4xl leading-tight">For the youth.</p>
          </TypeRow>
          <TypeRow label="H2 — Sub-headlines" classes="text-2xl font-bold">
            <p className="text-2xl font-bold">About us</p>
          </TypeRow>
          <TypeRow label="H3 — In-text headlines" classes="text-lg font-medium">
            <p className="text-lg font-medium">Mission</p>
          </TypeRow>
          <TypeRow label="Body copy" classes="text-base (font-normal)">
            <p className="text-base">
              Young Muslims isn&apos;t a program you attend. It&apos;s a friend
              group you belong to. Across the country, YM is thousands of young
              adults who hang out every week.
            </p>
          </TypeRow>
          <TypeRow label="Navigation / all caps" classes="text-sm font-semibold uppercase">
            <p className="text-sm font-semibold uppercase">Navigation items</p>
          </TypeRow>
          <TypeRow label="Small / meta" classes="text-sm text-muted-foreground">
            <p className="text-sm text-muted-foreground">
              Supporting detail, timestamps, helper text.
            </p>
          </TypeRow>
        </div>
      </Section>

      <Separator />

      <Section
        title="Buttons"
        description="Every variant defined in components/ui/button.tsx. Add a CVA variant there rather than forking the component."
      >
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-6">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button variant="link-destructive">Link destructive</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sizes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Badges"
        description="Every variant defined in components/ui/badge.tsx."
      >
        <Card>
          <CardContent className="flex flex-wrap gap-3 p-6">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Forms"
        description="Inputs inherit the brand border and focus ring."
      >
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ds-name">Full name</Label>
              <Input id="ds-name" placeholder="Yusuf Abdullah" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-email">Email</Label>
              <Input id="ds-email" type="email" placeholder="you@youngmuslims.com" />
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section
        title="Cards"
        description="Standard content container. Padding is p-6 throughout the app."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Neighbor Net</CardTitle>
              <CardDescription>Maryam Masjid · Houston</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cards sit in Pure White on the Warm Snow page background, so they
              lift without needing a heavy shadow.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>With actions</CardTitle>
              <CardDescription>Buttons align to the content edge</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm">Confirm</Button>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  )
}
