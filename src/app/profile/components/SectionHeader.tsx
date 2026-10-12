/**
 * Title + one-line description for a profile section. The sections are shared
 * with /people/[id] and the completion flow, which haven't adopted the brand,
 * so the brand type (Figtree Bold, -2% tracking) applies only inside a
 * `data-theme="ym"` scope and everywhere else it renders exactly as before.
 */
export function SectionHeader({
  title,
  description,
  className,
}: {
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold tracking-tight text-foreground [[data-theme=ym]_&]:text-h2 [[data-theme=ym]_&]:font-bold [[data-theme=ym]_&]:tracking-brand">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
