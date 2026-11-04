'use client'

import { useState } from 'react'
import { DocsContent } from '@/app/(app)/docs/DocsContent'
import DocsLoading from '@/app/(app)/docs/loading'
import { Button } from '@/components/ui/button'
import type { DocCategory, DocLink } from '@/data/docs'

export function DocsReview({ resources, categories, showControls = true }: { resources: DocLink[]; categories: DocCategory[]; showControls?: boolean }) {
  const [view, setView] = useState('Overview')
  return <>
    {showControls && <aside aria-label="Docs review controls" className="space-y-2 border-b bg-card p-4">
      <p className="text-sm font-medium">Approved Docs feature · sample links</p>
      <div className="flex flex-wrap gap-2">{['Overview', 'Second category', 'Loading'].map(label => <Button key={label} aria-pressed={view === label} variant={view === label ? 'default' : 'outline'} className="min-h-11" onClick={() => setView(label)}>{label}</Button>)}</div>
      <p className="text-xs text-muted-foreground">Document links are samples here. The authenticated Docs page retains its existing destinations. Navigation is outside this feature.</p>
    </aside>}
    {view === 'Loading' ? <DocsLoading /> : <DocsContent key={view} resources={resources} categories={categories} defaultOpenCategories={[view === 'Second category' ? 'Tarbiyah / SC' : 'NNET Situations']} />}
  </>
}
