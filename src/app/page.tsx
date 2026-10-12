import { redirect } from 'next/navigation'

// Server-side redirect: the PWA launches here, and the old client page had to
// download, hydrate and check the session before it could navigate. Middleware
// bounces signed-out users from /home/ to /login/.
export default function RootPage() {
  redirect('/home/')
}
