'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { DocLink } from '@/components/docs'
import { PageHeader } from '@/components/layout/page-header'
import type { DocCategory, DocLink as DocumentLink } from '@/data/docs'

interface DocsContentProps {
  resources: DocumentLink[]
  categories: DocCategory[]
  defaultOpenCategories?: string[]
}

export function DocsContent({ resources, categories, defaultOpenCategories = ['NNET Situations'] }: DocsContentProps) {
  return <div className="flex w-full max-w-[1064px] flex-col gap-4 px-4 pb-8 pt-5 sm:gap-6 sm:px-8 sm:pt-8">
    <PageHeader className="[&>div>div]:space-y-1 [&_h1]:leading-tight [&_p]:leading-tight" title="Docs" description="SOPs, guides, and reference documents" />
    <section aria-labelledby="docs-resources" className="space-y-3">
      <h2 id="docs-resources" className="text-lg font-medium leading-6">Resources</h2>
      <p className="leading-tight text-muted-foreground">Frequently accessed reference documents</p>
      <div className="divide-y divide-border overflow-hidden rounded-3xl border bg-card">{resources.map(doc => <DocLink key={doc.url} title={doc.title} url={doc.url} />)}</div>
    </section>
    <section aria-labelledby="docs-procedures" className="space-y-3">
      <h2 id="docs-procedures" className="text-lg font-medium leading-6">Standard Operating Procedures</h2>
      <p className="leading-tight text-muted-foreground">Organized by department and function</p>
      <Accordion type="multiple" defaultValue={defaultOpenCategories} className="overflow-hidden rounded-3xl border bg-card">
        {categories.map(category => <AccordionItem key={category.name} value={category.name} className="last:border-b-0">
          <AccordionTrigger className="min-h-14 gap-4 px-4 py-4 leading-tight hover:bg-secondary/50 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" icon={<DocGlyph size={20} />}>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3"><span>{category.name}</span><Badge variant="secondary" className="shrink-0 rounded-full border-0 px-3 py-1 text-xs font-normal leading-tight">{category.docs.length} {category.docs.length === 1 ? 'doc' : 'docs'}</Badge></span>
          </AccordionTrigger>
          <AccordionContent className="divide-y divide-border border-t pb-0">{category.docs.map(doc => <DocLink key={doc.url} title={doc.title} url={doc.url} nested />)}</AccordionContent>
        </AccordionItem>)}
      </Accordion>
    </section>
  </div>
}

/** Exact icon specimens from the approved Figma frames. */
export function DocGlyph({ size }: { size: 20 | 24 }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/brand/docs/icon-${size}.svg`} width={size} height={size} alt="" aria-hidden="true" className="shrink-0" />
}
