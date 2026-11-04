import type { Metadata } from 'next'
import { ScreenReview } from './screen-review'

export const metadata: Metadata = { title: 'YM screen review', robots: { index: false } }

export default async function DesignPreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  return <ScreenReview initialScreen={typeof params.screen === 'string' ? params.screen : 'home'} initialState={typeof params.state === 'string' ? params.state : 'default'} showControls={params.controls !== 'hidden'} />
}
