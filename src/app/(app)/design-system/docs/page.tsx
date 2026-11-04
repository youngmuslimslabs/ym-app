import type { Metadata } from 'next'
import { DocsScope } from '@/components/docs/DocsScope'
import { DocsReview } from '@/components/docs/DocsReview'
import { RESOURCES, SOP_CATEGORIES } from '@/data/docs'

export const metadata: Metadata = { title: 'Approved Docs review', robots: { index: false } }

/** Existing public design-system surface; real document destinations are omitted. */
export default async function DocsReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  let index = 0
  const sample = (doc: { title: string }) => ({ title: doc.title, url: `#sample-document-${index++}` })
  return <DocsScope><DocsReview showControls={params.controls !== 'hidden'} resources={RESOURCES.map(sample)} categories={SOP_CATEGORIES.map(category => ({ name: category.name, docs: category.docs.map(sample) }))} /></DocsScope>
}
