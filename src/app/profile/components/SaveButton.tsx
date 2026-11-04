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
 * Uses the shared save controller in its full-width footer presentation.
 */
export function SaveButton({
  hasChanges,
  changeCount,
  onSave,
  className,
}: SaveButtonProps) {
  return (
    <FloatingSaveBar
      presentation="footer"
      errorMessage="Changes weren’t saved. Your edits are still here."
      hasChanges={hasChanges}
      changeCount={changeCount}
      onSave={onSave}
      className={className}
    />
  )
}
