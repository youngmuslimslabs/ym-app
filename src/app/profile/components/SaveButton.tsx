'use client'

import { FloatingSaveBar } from '@/components/ui/floating-save-bar'

interface SaveButtonProps {
  hasChanges: boolean
  changeCount: number
  onSave: () => Promise<void>
  className?: string
}

/**
 * Profile-specific save button wrapper.
 * Uses the reusable FloatingSaveBar component.
 */
export function SaveButton({
  hasChanges,
  changeCount,
  onSave,
  className,
}: SaveButtonProps) {
  return (
    <FloatingSaveBar
      hasChanges={hasChanges}
      changeCount={changeCount}
      onSave={onSave}
      className={className}
    />
  )
}
