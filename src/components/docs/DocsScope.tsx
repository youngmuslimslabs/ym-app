import type { ReactNode } from 'react'
import { figtree } from '@/lib/brand-fonts'
import styles from '@/app/(app)/docs/docs-scope.module.css'

/** Approved Docs content only; navigation and other routes retain their current design. */
export function DocsScope({ children }: { children: ReactNode }) {
  return <div data-theme="ym" className={`${figtree.variable} ${styles.scope} min-h-full bg-background font-sans tracking-brand text-foreground`}>{children}</div>
}
