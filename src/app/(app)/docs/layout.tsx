import { DocsScope } from '@/components/docs/DocsScope'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsScope>{children}</DocsScope>
}
