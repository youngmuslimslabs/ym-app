import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export function getPostHogServer(): PostHog {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) {
      throw new Error('NEXT_PUBLIC_POSTHOG_KEY is not set')
    }
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}
