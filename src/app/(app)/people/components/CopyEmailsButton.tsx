'use client'

import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import type { PersonListItem } from '../types'

interface CopyEmailsButtonProps {
  people: PersonListItem[]
}

export function CopyEmailsButton({ people }: CopyEmailsButtonProps) {
  const { copied, copy } = useCopyToClipboard({
    onError: (err) => console.error('Failed to copy emails:', err),
  })

  const handleCopy = () => {
    void copy(people.map((p) => p.email).join(', '))
  }

  if (people.length === 0) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy emails</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{copied ? `${people.length} emails copied!` : `Copy ${people.length} emails`}</p>
      </TooltipContent>
    </Tooltip>
  )
}
