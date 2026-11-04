import { RESOURCES, SOP_CATEGORIES } from '@/data/docs'
import { DocsContent } from './DocsContent'

export default function DocsPage() {
  return <DocsContent resources={RESOURCES} categories={SOP_CATEGORIES} />
}
