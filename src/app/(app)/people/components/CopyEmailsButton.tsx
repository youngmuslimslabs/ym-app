'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PersonListItem } from '../types'

interface CopyEmailsButtonProps {
  people: PersonListItem[]
}

export function CopyEmailsButton({ people }: CopyEmailsButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const emails = people.map((p) => p.email).join(', ')
    try {
      await navigator.clipboard.writeText(emails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy emails:', err)
    }
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
            <Check className="h-4 w-4 text-green-600" />
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
