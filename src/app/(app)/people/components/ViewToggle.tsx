'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ViewMode } from '../types'

interface ViewToggleProps {
  view: ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <Tabs value={view} onValueChange={(v) => onChange(v as ViewMode)}>
      <TabsList className="h-10 rounded-xl p-1">
        <TabsTrigger value="cards" className="h-8 w-9 rounded-lg p-0 data-[state=active]:text-primary">
          <LayoutGrid className="h-4 w-4" />
          <span className="sr-only">Card view</span>
        </TabsTrigger>
        <TabsTrigger value="table" className="h-8 w-9 rounded-lg p-0 data-[state=active]:text-primary">
          <List className="h-4 w-4" />
          <span className="sr-only">Table view</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
