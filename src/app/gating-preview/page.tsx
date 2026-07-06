import { GatingPreview } from './GatingPreview'

// PROTOTYPE-ONLY: force dynamic so the reused PersonCard's useSearchParams()
// doesn't trip the static-prerender Suspense requirement.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gating preview',
}

export default function GatingPreviewPage() {
  return <GatingPreview />
}
