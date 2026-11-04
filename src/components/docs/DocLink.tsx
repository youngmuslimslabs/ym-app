import { cn } from '@/lib/utils'

interface DocLinkProps {
  title: string
  url: string
  nested?: boolean
}

export function DocLink({ title, url, nested = false }: DocLinkProps) {
  return <a href={url} target="_blank" rel="noopener noreferrer" className={cn('flex min-h-11 items-center gap-4 px-4 py-3 text-sm font-medium leading-tight transition-colors duration-200 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', nested ? 'pl-8' : 'min-h-14 py-4')}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {!nested && <img src="/brand/docs/icon-24.svg" width={24} height={24} alt="" aria-hidden="true" className="shrink-0" />}
    <span className="min-w-0 flex-1 break-words">{title}<span className="sr-only"> (opens in a new tab)</span></span>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/brand/docs/icon-20.svg" width={20} height={20} alt="" aria-hidden="true" className="shrink-0" />
  </a>
}
