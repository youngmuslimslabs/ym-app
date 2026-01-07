import { FileText, ExternalLink } from 'lucide-react'

interface DocLinkProps {
  title: string
  url: string
}

/**
 * A clickable link row for documents that opens in a new tab.
 * Used for both Resources and SOP items.
 */
export function DocLink({ title, url }: DocLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{title}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </a>
  )
}
