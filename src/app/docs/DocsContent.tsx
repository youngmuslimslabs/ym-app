'use client'

import { FileText } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { DocLink } from '@/components/docs'
import { RESOURCES, SOP_CATEGORIES } from '@/data/docs'

export function DocsContent() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] md:min-h-screen px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* Page Header */}
        <div
          className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
              <p className="text-sm text-muted-foreground">
                SOPs, guides, and reference documents
              </p>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <section
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '100ms' }}
        >
          <div>
            <h2 className="text-lg font-semibold">Resources</h2>
            <p className="text-sm text-muted-foreground">
              Frequently accessed reference documents
            </p>
          </div>
          <div className="space-y-1">
            {RESOURCES.map((doc) => (
              <DocLink key={doc.url} title={doc.title} url={doc.url} />
            ))}
          </div>
        </section>

        {/* SOPs Section */}
        <section
          className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: '200ms' }}
        >
          <div>
            <h2 className="text-lg font-semibold">Standard Operating Procedures</h2>
            <p className="text-sm text-muted-foreground">
              Organized by department and function
            </p>
          </div>
          <Accordion type="multiple" className="w-full">
            {SOP_CATEGORIES.map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {category.docs.length} {category.docs.length === 1 ? 'doc' : 'docs'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 pt-1">
                    {category.docs.map((doc) => (
                      <DocLink key={doc.url} title={doc.title} url={doc.url} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  )
}
